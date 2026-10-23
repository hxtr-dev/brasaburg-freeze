import { NextResponse } from 'next/server';
import { ensureSchema, getPool } from '@/lib/db';
import { isKitchenAuthed } from '@/lib/kitchen-auth';

const ALLOWED = new Set(['novo', 'pronto', 'entregue', 'cancelado']);

// Muda o status do pedido ({ status }) ou confirma/desfaz o pagamento ({ paid: true | false }).
export async function PATCH(request, { params }) {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });

  const pool = getPool();
  let result;
  if (typeof body.paid === 'boolean') {
    await ensureSchema();
    result = await pool.query(
      `update orders set paid_at = case when $1 then coalesce(paid_at, now()) else null end where id = $2`,
      [body.paid, id],
    );
  } else if (ALLOWED.has(body.status)) {
    result = await pool.query(
      `update orders
       set status = $1,
           ready_at = case when $1 = 'pronto' then coalesce(ready_at, now()) when $1 = 'novo' then null else ready_at end
       where id = $2`,
      [body.status, id],
    );
  } else {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }
  if (result.rowCount === 0) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
