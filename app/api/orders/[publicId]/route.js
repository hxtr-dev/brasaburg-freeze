import { NextResponse } from 'next/server';
import { ensureSchema, getPool } from '@/lib/db';
import { paymentLabel, resolveItem } from '@/lib/menu';
import { orderLabel } from '@/lib/phone';

function toJson(o) {
  return {
    number: orderLabel(o.daily_number),
    name: o.customer_name,
    items: o.items,
    total: o.total_cents,
    payment: o.payment_method ?? null,
    paidAt: o.paid_at ?? null,
    status: o.status,
    createdAt: o.created_at,
    readyAt: o.ready_at,
  };
}

export async function GET(_request, { params }) {
  const { publicId } = await params;
  await ensureSchema();
  const { rows } = await getPool().query(`select * from orders where public_id = $1`, [publicId]);
  if (rows.length === 0) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  return NextResponse.json(toJson(rows[0]));
}

// O cliente troca a forma de pagamento enquanto o pedido ainda não foi pago; o total é recalculado.
export async function PATCH(request, { params }) {
  const { publicId } = await params;
  const { payment } = await request.json().catch(() => ({}));
  if (!paymentLabel(payment)) return NextResponse.json({ error: 'Forma de pagamento inválida' }, { status: 400 });

  await ensureSchema();
  const pool = getPool();
  const { rows } = await pool.query(`select * from orders where public_id = $1`, [publicId]);
  if (rows.length === 0) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  if (rows[0].paid_at) return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });

  const items = rows[0].items.map((i) => resolveItem({ productId: i.productId, qty: i.qty, flavors: i.flavors }, payment));
  const total = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const updated = await pool.query(
    `update orders set payment_method = $1, items = $2, total_cents = $3
     where public_id = $4 and paid_at is null returning *`,
    [payment, JSON.stringify(items), total, publicId],
  );
  if (updated.rowCount === 0) return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });
  return NextResponse.json(toJson(updated.rows[0]));
}
