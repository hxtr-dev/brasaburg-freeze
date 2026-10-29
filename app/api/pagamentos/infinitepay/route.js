import { NextResponse } from 'next/server';
import { ensureSchema, getPool } from '@/lib/db';

const HANDLE = process.env.INFINITEPAY_HANDLE || 'heitor-oliveira-du1';

function mapCaptureMethod(method) {
  if (!method) return null;
  const m = method.toLowerCase();
  if (m === 'pix') return 'pix';
  if (m.includes('debit')) return 'debito';
  if (m.includes('credit')) return 'credito';
  return null;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { order_nsu, slug, transaction_nsu, capture_method } = body;

  if (!order_nsu || !slug || !transaction_nsu) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Verify payment with InfinitePay before trusting the webhook
  let verified;
  try {
    const check = await fetch('https://api.checkout.infinitepay.io/payment_check', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ handle: HANDLE, order_nsu, transaction_nsu, slug }),
    });
    verified = await check.json();
  } catch {
    return NextResponse.json({ error: 'Verification failed' }, { status: 502 });
  }

  if (!verified.paid) return NextResponse.json({ ok: false });

  const paymentMethod = mapCaptureMethod(verified.capture_method || capture_method);

  await ensureSchema();
  const pool = getPool();
  await pool.query(
    `update orders
     set paid_at = now(), payment_method = coalesce($1, payment_method)
     where public_id = $2 and paid_at is null`,
    [paymentMethod, order_nsu],
  );

  return NextResponse.json({ ok: true });
}
