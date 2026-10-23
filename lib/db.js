import pg from 'pg';

// Um pool por instância. No Neon, use a connection string "pooled" (com -pooler no host).
const globalForPg = globalThis;

export function getPool() {
  if (!globalForPg.__brasaPool) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL não configurada');
    globalForPg.__brasaPool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  }
  return globalForPg.__brasaPool;
}

// Colunas adicionadas depois da primeira versão do banco. Roda uma vez por instância,
// assim o banco do Neon se atualiza sozinho no primeiro pedido depois do deploy.
export function ensureSchema() {
  if (!globalForPg.__brasaSchema) {
    globalForPg.__brasaSchema = getPool()
      .query(
        `alter table orders add column if not exists payment_method text;
         alter table orders add column if not exists paid_at timestamptz;`,
      )
      .catch((err) => {
        globalForPg.__brasaSchema = null;
        throw err;
      });
  }
  return globalForPg.__brasaSchema;
}

export const TIMEZONE = 'America/Sao_Paulo';
