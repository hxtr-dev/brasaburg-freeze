import { NextResponse } from 'next/server';
import { ensureSchema, getPool } from '@/lib/db';
import { isKitchenAuthed } from '@/lib/kitchen-auth';

export const dynamic = 'force-dynamic';

// Ranking de indicações: pessoas diferentes (WhatsApp) com pedido pago usando o código.
export async function GET() {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  await ensureSchema();
  const { rows } = await getPool().query(
    `select c.code, c.name, c.phone,
            count(distinct o.customer_phone) filter (where o.paid_at is not null)::int as people,
            count(distinct o.customer_phone) filter (where o.paid_at is null)::int as pending
     from referral_codes c
     left join orders o on o.referral_code = c.code and o.status <> 'cancelado'
     group by c.code, c.name, c.phone, c.created_at
     order by people desc, pending desc, c.created_at asc`,
  );
  return NextResponse.json({ ranking: rows });
}
