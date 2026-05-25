-- Grade Horária IMP — Schema do Banco de Dados
-- Executar no Supabase SQL Editor

-- Habilitar UUID
create extension if not exists "uuid-ossp";

-- Professores
create table professores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text not null unique,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Matérias
create table materias (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  created_at timestamptz default now()
);

-- Professor <-> Matéria (um professor leciona várias matérias)
create table professor_materias (
  professor_id uuid references professores(id) on delete cascade,
  materia_id uuid references materias(id) on delete cascade,
  primary key (professor_id, materia_id)
);

-- Turmas
create table turmas (
  id uuid primary key default uuid_generate_v4(),
  codigo text not null unique,
  concurso text not null,
  local text not null,
  turno text not null check (turno in ('M', 'T', 'N')),
  data_inicio date not null,
  status text default 'ativa' check (status in ('ativa', 'encerrada')),
  created_at timestamptz default now()
);

-- Semanas de grade
create table semanas (
  id uuid primary key default uuid_generate_v4(),
  data_inicio date not null,
  data_fim date not null,
  status text default 'rascunho' check (status in ('rascunho', 'publicada')),
  created_at timestamptz default now()
);

-- Aulas (slots da grade)
create table aulas (
  id uuid primary key default uuid_generate_v4(),
  semana_id uuid references semanas(id) on delete cascade,
  turma_id uuid references turmas(id) on delete cascade,
  professor_id uuid references professores(id) on delete cascade,
  materia_id uuid references materias(id) on delete cascade,
  dia_semana text not null check (dia_semana in ('segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado')),
  turno text not null check (turno in ('M', 'T', 'N')),
  horario_inicio time not null,
  horario_fim time not null,
  carga_horaria numeric(4,2),
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — ativar em todas as tabelas
alter table professores enable row level security;
alter table materias enable row level security;
alter table professor_materias enable row level security;
alter table turmas enable row level security;
alter table semanas enable row level security;
alter table aulas enable row level security;

-- Policies: apenas usuários autenticados têm acesso total
create policy "acesso_autenticado" on professores for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on materias for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on professor_materias for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on turmas for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on semanas for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on aulas for all using (auth.role() = 'authenticated');
