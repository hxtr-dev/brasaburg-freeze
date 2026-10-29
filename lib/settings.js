import { ensureSchema, getPool } from '@/lib/db';

// Hambúrgueres esgotados: liga e desliga pela cozinha. Vale também para os combos com hambúrguer e o molho.
export async function getBurgersSoldOut() {
  await ensureSchema();
  const { rows } = await getPool().query(`select value from settings where key = 'burgers_sold_out'`);
  // Sem ajuste salvo ainda: começa como sold out, que é como o site foi publicado.
  return rows[0] ? rows[0].value === true : true;
}

export async function setBurgersSoldOut(on) {
  await ensureSchema();
  await getPool().query(
    `insert into settings (key, value) values ('burgers_sold_out', $1::jsonb)
     on conflict (key) do update set value = excluded.value`,
    [JSON.stringify(Boolean(on))],
  );
}
