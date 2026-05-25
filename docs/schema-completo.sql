-- Schedulio — Schema completo do banco de dados
-- Executar no Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Professores
create table professores (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  email text not null unique,
  ativo boolean default true,
  valor_de_entrada numeric(10,2) default 0,
  created_at timestamptz default now()
);

-- Matérias
create table materias (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  created_at timestamptz default now()
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

-- Disciplinas de cada turma
create table turma_materias (
  id uuid primary key default uuid_generate_v4(),
  turma_id uuid references turmas(id) on delete cascade,
  materia_id uuid references materias(id) on delete cascade,
  carga_horaria_total numeric(6,2) default 0,
  created_at timestamptz default now(),
  unique(turma_id, materia_id)
);

-- Professores vinculados a cada disciplina de cada turma
create table turma_materia_professores (
  turma_id uuid references turmas(id) on delete cascade,
  materia_id uuid references materias(id) on delete cascade,
  professor_id uuid references professores(id) on delete cascade,
  primary key (turma_id, materia_id, professor_id)
);

-- Semanas de grade
create table semanas (
  id uuid primary key default uuid_generate_v4(),
  data_inicio date not null,
  data_fim date not null,
  status text default 'rascunho' check (status in ('rascunho', 'publicada')),
  created_at timestamptz default now()
);

-- Aulas (slots da grade semanal)
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

-- Pagamentos
create table pagamentos (
  id uuid primary key default uuid_generate_v4(),
  professor_id uuid references professores(id) on delete cascade,
  periodo_inicio date not null,
  periodo_fim date not null,
  tipo text not null check (tipo in ('semanal', 'mensal')),
  total_aulas integer default 0,
  valor_de_entrada numeric(10,2) default 0,
  total_valor numeric(10,2) default 0,
  status text default 'pendente' check (status in ('pendente', 'pago')),
  created_at timestamptz default now()
);

-- RLS
alter table professores enable row level security;
alter table materias enable row level security;
alter table turmas enable row level security;
alter table turma_materias enable row level security;
alter table turma_materia_professores enable row level security;
alter table semanas enable row level security;
alter table aulas enable row level security;
alter table pagamentos enable row level security;

-- Policies: apenas usuários autenticados
create policy "acesso_autenticado" on professores for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on materias for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on turmas for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on turma_materias for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on turma_materia_professores for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on semanas for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on aulas for all using (auth.role() = 'authenticated');
create policy "acesso_autenticado" on pagamentos for all using (auth.role() = 'authenticated');
