-- Aja tämä Supabase SQL Editorissa: https://supabase.com/dashboard

-- Käyttäjät
create table if not exists users (
  id bigserial primary key,
  name text unique not null,
  role text not null default 'WORKER',
  created_at timestamptz default now()
);

-- Lisää Admin-käyttäjä
insert into users (name, role) values ('Admin', 'ADMIN')
on conflict (name) do nothing;

-- Urakat
create table if not exists contracts (
  id bigserial primary key,
  name text not null,
  description text not null default '',
  value numeric,
  contract_type text not null default 'FIXED',
  hourly_rates jsonb not null default '{}',
  status text not null default 'ACTIVE',
  created_at timestamptz default now()
);

-- Työtunnit
create table if not exists work_hours (
  id bigserial primary key,
  user_id bigint references users(id) on delete cascade,
  contract_id bigint references contracts(id) on delete cascade,
  hours numeric not null,
  date text not null,
  description text not null default '',
  work_type text not null default 'CUSTOMER',
  created_at timestamptz default now()
);

-- Salli kaikki operaatiot anon-avaimella (sisäinen työkalu)
alter table users enable row level security;
alter table contracts enable row level security;
alter table work_hours enable row level security;

create policy "allow all users" on users for all using (true) with check (true);
create policy "allow all contracts" on contracts for all using (true) with check (true);
create policy "allow all work_hours" on work_hours for all using (true) with check (true);
