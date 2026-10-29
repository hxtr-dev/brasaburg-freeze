-- Pedidos da BrasaBurg & Freeze (Neon / Postgres)
create table if not exists orders (
  id             bigserial primary key,
  public_id      text not null unique,          -- usado no link de acompanhamento do cliente
  order_date     date not null,                 -- dia do pedido no horário de Brasília
  daily_number   integer not null,              -- 1, 2, 3... volta a 1 todo dia (exibido como 001)
  customer_name  text not null,
  customer_phone text not null,                 -- só dígitos, com DDI 55
  items          jsonb not null,
  total_cents    integer not null check (total_cents >= 0),
  status         text not null default 'novo' check (status in ('novo', 'pronto', 'entregue', 'cancelado')),
  created_at     timestamptz not null default now(),
  ready_at       timestamptz,
  unique (order_date, daily_number)
);

-- Forma de pagamento escolhida pelo cliente (pix, debito, credito); pagamento no balcão.
alter table orders add column if not exists payment_method text;

-- Quando a equipe confirmou o pagamento no balcão (null = aguardando pagamento).
alter table orders add column if not exists paid_at timestamptz;

create index if not exists orders_status_created_idx on orders (status, created_at);

-- Código de indicação usado no pedido (referral_codes.code).
alter table orders add column if not exists referral_code text;
create index if not exists orders_referral_idx on orders (referral_code);

-- Ajustes ligados pela cozinha, como { key: 'burgers_sold_out', value: true }.
create table if not exists settings (key text primary key, value jsonb not null);

-- Um código de indicação por WhatsApp, gerado na página "Código".
create table if not exists referral_codes (
  code       text primary key,
  name       text not null,
  phone      text not null unique,
  created_at timestamptz not null default now()
);
