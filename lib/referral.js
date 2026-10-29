import { ensureSchema, getPool } from '@/lib/db';

export function normalizeCode(input) {
  return String(input ?? '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 16);
}

// Código = primeiro nome sem acento (até 8 letras) + 4 últimos números do WhatsApp. Ex.: ELVIS4321.
function baseCode(name, phone) {
  const first = String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '')
    .trim()
    .split(/\s+/)[0]
    .slice(0, 8);
  return `${first || 'BRASA'}${phone.slice(-4)}`;
}

// Devolve o código do WhatsApp; se ainda não existir, cria um.
export async function getOrCreateCode(name, phone) {
  await ensureSchema();
  const pool = getPool();
  const existing = await pool.query(`select code, name from referral_codes where phone = $1`, [phone]);
  if (existing.rows[0]) return existing.rows[0];

  const base = baseCode(name, phone);
  for (let n = 1; n < 50; n++) {
    const code = n === 1 ? base : `${base}${n}`;
    const { rows } = await pool.query(
      `insert into referral_codes (code, name, phone) values ($1, $2, $3)
       on conflict do nothing returning code, name`,
      [code, name, phone],
    );
    if (rows[0]) return rows[0];
    // Pode ter sido o mesmo WhatsApp criando o código ao mesmo tempo.
    const again = await pool.query(`select code, name from referral_codes where phone = $1`, [phone]);
    if (again.rows[0]) return again.rows[0];
  }
  throw new Error('Não foi possível gerar o código');
}

// Regras do programa de indicação. Devolve { code } quando pode usar, ou { error } com a mensagem para o cliente.
export async function checkReferral(rawCode, phone) {
  const code = normalizeCode(rawCode);
  if (!code) return { code: null };
  await ensureSchema();
  const pool = getPool();
  const owner = await pool.query(`select phone from referral_codes where code = $1`, [code]);
  if (!owner.rows[0]) return { error: 'Código de indicação não encontrado' };
  if (owner.rows[0].phone === phone) return { error: 'Você não pode usar seu próprio código como indicação' };
  const used = await pool.query(
    `select 1 from orders where referral_code = $1 and customer_phone = $2 and status <> 'cancelado' limit 1`,
    [code, phone],
  );
  if (used.rows[0]) return { error: 'Utilize outro código' };
  return { code };
}
