import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ensureSchema, getPool, TIMEZONE } from '@/lib/db';
import { needsBurger, paymentLabel, resolveItem } from '@/lib/menu';
import { normalizePhone, orderLabel } from '@/lib/phone';
import { checkReferral } from '@/lib/referral';
import { getBurgersSoldOut } from '@/lib/settings';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }

  const name = String(body?.name ?? '').trim().slice(0, 60);
  const phone = normalizePhone(body?.phone);
  if (name.length < 2) return NextResponse.json({ error: 'Informe seu nome' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'WhatsApp inválido. Use DDD + número.' }, { status: 400 });

  const payment = String(body?.payment ?? '');
  if (!paymentLabel(payment)) return NextResponse.json({ error: 'Escolha a forma de pagamento' }, { status: 400 });

  const rawItems = Array.isArray(body?.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > 30) {
    return NextResponse.json({ error: 'Seu carrinho está vazio' }, { status: 400 });
  }

  let items;
  try {
    items = rawItems.map(resolveItem);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const publicId = randomBytes(9).toString('base64url');

  // O número do dia é max+1; se dois pedidos chegarem juntos, a unique constraint barra um e tentamos de novo.
  const pool = getPool();
  let referral;
  try {
    await ensureSchema();
    if (items.some((i) => needsBurger(i.productId)) && (await getBurgersSoldOut())) {
      return NextResponse.json(
        { error: 'Os hambúrgueres estão esgotados (sold out). Tire do carrinho os itens com hambúrguer ou molho.' },
        { status: 409 },
      );
    }
    referral = await checkReferral(body?.referral, phone);
  } catch (err) {
    console.error('Erro ao validar pedido', err);
    return NextResponse.json({ error: 'Não foi possível enviar o pedido. Tente de novo.' }, { status: 500 });
  }
  if (referral.error) return NextResponse.json({ error: referral.error }, { status: 400 });
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const { rows } = await pool.query(
        `insert into orders (public_id, order_date, daily_number, customer_name, customer_phone, items, total_cents, payment_method, referral_code)
         select $1, d.today,
                coalesce((select max(daily_number) from orders where order_date = d.today), 0) + 1,
                $2, $3, $4, $5, $6, $7
         from (select (now() at time zone '${TIMEZONE}')::date as today) d
         returning daily_number`,
        [publicId, name, phone, JSON.stringify(items), total, payment, referral.code],
      );
      return NextResponse.json({ publicId, number: orderLabel(rows[0].daily_number) }, { status: 201 });
    } catch (err) {
      if (err.code !== '23505') {
        console.error('Erro ao gravar pedido', err);
        return NextResponse.json({ error: 'Não foi possível enviar o pedido. Tente de novo.' }, { status: 500 });
      }
    }
  }
  return NextResponse.json({ error: 'Muitos pedidos ao mesmo tempo. Tente de novo.' }, { status: 503 });
}
