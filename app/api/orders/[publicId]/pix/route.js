import { NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { ensureSchema, getPool } from '@/lib/db';
import { buildPix, pixConfig } from '@/lib/pix';

export async function GET(_req, { params }) {
  const cfg = pixConfig();
  if (!cfg) return NextResponse.json({ error: 'Pix indisponível' }, { status: 404 });
  const { publicId } = await params;
  await ensureSchema();
  const { rows } = await getPool().query(`select total_cents, daily_number, paid_at from orders where public_id = $1`, [publicId]);
  if (!rows.length) return NextResponse.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  if (rows[0].paid_at) return NextResponse.json({ error: 'Este pedido já foi pago.' }, { status: 409 });
  const payload = buildPix({ ...cfg, cents: rows[0].total_cents, txid: `BBF${rows[0].daily_number}${publicId.replace(/\W/g, '').slice(0, 8)}` });
  const qr = await QRCode.toDataURL(payload, { margin: 1, width: 320 });
  return NextResponse.json({ payload, qr, name: cfg.name });
}
