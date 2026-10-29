import { NextResponse } from 'next/server';
import { ensureSchema, getPool } from '@/lib/db';

const HANDLE = process.env.INFINITEPAY_HANDLE || 'heitor-oliveira-du1';
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://brasaburg-freeze.vercel.app';

export async function POST(_req, { params }) {
  const { publicId } = await params;
  await ensureSchema();
  const pool = getPool();

  const { rows } = await pool.query(
    `select total_cents, customer_name, paid_at from orders where public_id = $1`,
    [publicId],
  );
  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  if (rows[0].paid_at) return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });

  const { total_cents, customer_name } = rows[0];

  let res;
  let data;
  try {
    res = await fetch('https://api.checkout.infinitepay.io/links', {
      method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      handle: HANDLE,
      items: [{ quantity: 1, price: total_cents, description: `Pedido BrasaBurg & Freeze – ${customer_name}` }],
      order_nsu: publicId,
      redirect_url: `${BASE_URL}/acompanhar/${publicId}`,
      webhook_url: `${BASE_URL}/api/pagamentos/infinitepay`,
    }),
    });
    data = await res.json();
  } catch {
    return NextResponse.json({ error: 'Não foi possível falar com a InfinitePay. Tente de novo.' }, { status: 502 });
  }
  if (!res.ok || !data?.url) {
    return NextResponse.json(
      { error: data.message || 'Não foi possível criar o link de pagamento.' },
      { status: 502 },
    );
  }

  return NextResponse.json({ url: data.url });
}
