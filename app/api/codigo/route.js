import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { getOrCreateCode } from '@/lib/referral';

// Página "Código": o cliente informa nome e WhatsApp e recebe o código de indicação dele.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim().slice(0, 60);
  const phone = normalizePhone(body?.phone);
  if (name.length < 2) return NextResponse.json({ error: 'Informe seu nome' }, { status: 400 });
  if (!phone) return NextResponse.json({ error: 'WhatsApp inválido. Use DDD + número.' }, { status: 400 });
  try {
    const { code } = await getOrCreateCode(name, phone);
    return NextResponse.json({ code });
  } catch (err) {
    console.error('Erro ao gerar código', err);
    return NextResponse.json({ error: 'Não foi possível gerar seu código. Tente de novo.' }, { status: 500 });
  }
}
