import { NextResponse } from 'next/server';
import { normalizePhone } from '@/lib/phone';
import { checkReferral } from '@/lib/referral';

// Confere o código de quem indicou antes de seguir para a confirmação do pedido.
export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const phone = normalizePhone(body?.phone);
  if (!phone) return NextResponse.json({ error: 'WhatsApp inválido. Use DDD + número.' }, { status: 400 });
  const result = await checkReferral(body?.code, phone);
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ code: result.code });
}
