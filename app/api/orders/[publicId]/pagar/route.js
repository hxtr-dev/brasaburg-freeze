import { NextResponse } from 'next/server';
import { ensureSchema, getPool } from '@/lib/db';

const HANDLE = process.env.INFINITEPAY_HANDLE || 'heitor-oliveira-du1';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brasaburg-freeze.vercel.app';

async function createLink(payload, apiKey) {
  const res = await fetch('https://api.checkout.infinitepay.io/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(apiKey ? { 'x-api-key': apiKey } : {}) },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok && Boolean(data?.url), data };
}

export async function POST(_req, { params }) {
  const { publicId } = await params;
  await ensureSchema();
  const pool = getPool();

  const { rows } = await pool.query(
    `select total_cents, customer_name, customer_phone, paid_at from orders where public_id = $1`,
    [publicId],
  );
  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  if (rows[0].paid_at) return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });

  const { total_cents, customer_name, customer_phone } = rows[0];
  const apiKey = process.env.INFINITEPAY_API_KEY;

  const base = {
    handle: HANDLE,
    items: [{ quantity: 1, price: total_cents, description: `Pedido BrasaBurg & Freeze – ${customer_name}` }],
    order_nsu: publicId,
    redirect_url: `${BASE_URL}/acompanhar/${publicId}`,
    webhook_url: `${BASE_URL}/api/pagamentos/infinitepay`,
  };
  // Nome e WhatsApp já vão preenchidos e, com a chave da API, o endereço de entrega não é pedido.
  // Se a InfinitePay recusar esses extras, tenta de novo só com o básico.
  const extras = {
    customer: { name: customer_name, phone_number: `+${customer_phone}` },
    ...(apiKey ? { options: { require_delivery_address: false } } : {}),
  };

  try {
    let result = await createLink({ ...base, ...extras }, apiKey);
    if (!result.ok) result = await createLink(base, undefined);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.data?.message || 'Não foi possível criar o link de pagamento.' },
        { status: 502 },
      );
    }
    return NextResponse.json({ url: result.data.url });
  } catch {
    return NextResponse.json({ error: 'Não foi possível falar com a InfinitePay. Tente de novo.' }, { status: 502 });
  }
}
