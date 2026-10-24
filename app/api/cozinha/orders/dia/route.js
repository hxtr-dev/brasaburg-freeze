import { NextResponse } from 'next/server';
import { ensureSchema, getPool, TIMEZONE } from '@/lib/db';
import { isKitchenAuthed } from '@/lib/kitchen-auth';
import { orderLabel } from '@/lib/phone';

export const dynamic = 'force-dynamic';

// Todos os pedidos de hoje, do primeiro ao último, para a conferência no fim do dia.
export async function GET() {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  await ensureSchema();
  const { rows } = await getPool().query(
    `select * from orders where order_date = (now() at time zone '${TIMEZONE}')::date order by daily_number asc`,
  );
  return NextResponse.json({
    orders: rows.map((o) => ({
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
    })),
  });
}
