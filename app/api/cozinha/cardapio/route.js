import { NextResponse } from 'next/server';
import { isKitchenAuthed } from '@/lib/kitchen-auth';
import { setBurgersSoldOut } from '@/lib/settings';

export async function PATCH(request) {
  if (!(await isKitchenAuthed())) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  const { burgersSoldOut } = await request.json().catch(() => ({}));
  if (typeof burgersSoldOut !== 'boolean') return NextResponse.json({ error: 'Valor inválido' }, { status: 400 });
  await setBurgersSoldOut(burgersSoldOut);
  return NextResponse.json({ burgersSoldOut });
}
