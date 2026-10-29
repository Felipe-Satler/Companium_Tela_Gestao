-- Executar no banco do projeto (o mesmo onde ficam auth/user_roles).
-- Cria o armazenamento compartilhado da aba Gestão (planilha de projetos/operações).

create table if not exists public.gestao_clientes (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  data_inicio date,
  status text,
  plano text,
  nmrr numeric,
  lider_revops text,
  responsavel_revops text,
  especialidade text,
  fonte_trafego text,
  crm text,
  tipo_crm text,
  an_performance text,
  an_design text,
  an_copy text,
  an_edicao text,
  data_inicio_ref date,
  data_fim_ref date,
  data_aviso_previo_ref date,
  mrr_atual numeric,
  clt_previsto numeric,
  clt_atual numeric,
  ltv_previsto numeric,
  ltv_real numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.gestao_importacoes (
  id uuid primary key default gen_random_uuid(),
  criado_em timestamptz not null default now(),
  criado_por text,
  nome_arquivo text,
  total_linhas integer not null default 0
);

grant select, insert, update, delete on public.gestao_clientes to authenticated;
grant select, insert, update, delete on public.gestao_importacoes to authenticated;
grant all on public.gestao_clientes to service_role;
grant all on public.gestao_importacoes to service_role;

alter table public.gestao_clientes enable row level security;
alter table public.gestao_importacoes enable row level security;

drop policy if exists "Admins gerenciam gestao_clientes" on public.gestao_clientes;
create policy "Admins gerenciam gestao_clientes"
  on public.gestao_clientes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins gerenciam gestao_importacoes" on public.gestao_importacoes;
create policy "Admins gerenciam gestao_importacoes"
  on public.gestao_importacoes for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create index if not exists gestao_clientes_status_idx on public.gestao_clientes (status);
create index if not exists gestao_clientes_cliente_idx on public.gestao_clientes (cliente);

-- Campos extras usados pelo dashboard BI (aba DB/Base da planilha).
alter table public.gestao_clientes add column if not exists motivo_cancelamento text;
alter table public.gestao_clientes add column if not exists data_aviso_previo date;
alter table public.gestao_clientes add column if not exists an_dados text;
