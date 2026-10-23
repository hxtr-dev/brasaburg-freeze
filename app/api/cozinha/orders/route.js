import { NextResponse } from 'next/server';
import { ensureSchema, getPool, TIMEZONE } from '@/lib/db';
import { isKitchenAuthed } from '@/lib/kitchen-auth';
import { orderLabel } from '@/lib/phone';

export const dynamic = 'force-dynamic';

function toJson(o) {
  return {
    id: String(o.id),
    number: orderLabel(o.daily_number),
    name: o.customer_name,
    phone: o.customer_phone,
    items: o.items,
    total: o.total_cents,
    payment: o.payment_method ?? null,
    paidAt: o.paid_at ?? null,
    status: o.status,
    createdAt: o.created_at,
    readyAt: o.ready_at,
  };
}

// Fila: pedidos em aberto por ordem de chegada, prontos e entregues de hoje e o resumo de valores do dia.
export async function GET() {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const pool = getPool();
  await ensureSchema();
  const today = `(now() at time zone '${TIMEZONE}')::date`;
  const [open, ready, delivered, summary] = await Promise.all([
    pool.query(`select * from orders where status = 'novo' order by created_at asc`),
    pool.query(`select * from orders where status = 'pronto' and order_date = ${today} order by ready_at desc limit 30`),
    pool.query(`select * from orders where status = 'entregue' and order_date = ${today} order by ready_at desc limit 100`),
    pool.query(
      `select paid_at is not null as paid, payment_method, count(*)::int as count, sum(total_cents)::int as total
       from orders where order_date = ${today} and status <> 'cancelado'
       group by 1, 2`,
    ),
  ]);
  return NextResponse.json({
    open: open.rows.map(toJson),
    ready: ready.rows.map(toJson),
    delivered: delivered.rows.map(toJson),
    summary: summary.rows,
    serverNow: new Date().toISOString(),
  });
}
