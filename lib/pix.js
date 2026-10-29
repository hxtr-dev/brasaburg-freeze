// Gera o "Pix copia e cola" (BR Code estático do Banco Central) com o valor do pedido.
function field(id, value) {
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16(str) {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const clean = (s, max) =>
  String(s)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .slice(0, max)
    .trim();

export function pixConfig() {
  const key = (process.env.PIX_KEY || 'prime.celulares77@gmail.com').trim();
  if (!key) return null;
  return { key, name: clean(process.env.PIX_NAME || 'BrasaBurg Freeze', 25), city: clean(process.env.PIX_CITY || 'Brasil', 15) };
}

export function buildPix({ key, name, city, cents, txid }) {
  const body =
    field('00', '01') +
    field('01', '11') +
    field('26', field('00', 'br.gov.bcb.pix') + field('01', key)) +
    field('52', '0000') +
    field('53', '986') +
    field('54', (cents / 100).toFixed(2)) +
    field('58', 'BR') +
    field('59', name) +
    field('60', city) +
    field('62', field('05', clean(txid, 25) || '***')) +
    '6304';
  return body + crc16(body);
}
