# Grade Horária IMP — Constituição do Projeto

## Visão
Sistema web de gestão de grade horária para o IMP Concursos. Substitui o processo manual de planilhas Excel com múltiplas abas, eliminando o copia-cola entre coordenadores e o envio artesanal de emails para professores.

## Problema Resolvido
Hoje 2 coordenadores gastam horas por semana:
1. Preenchendo manualmente 29 abas de planilha
2. Copiando informações para uma planilha de "tirinhas" por professor
3. Tirando print de cada tirinha
4. Enviando emails individuais para ~60 professores

## Público-alvo
- **Coordenadores de grade** (2 pessoas) — usuários principais, desktop only
- **Professores** (~60 ativos) — acesso secundário via portal ou email

## Estrutura do Sistema

### Módulo 1 — Cadastros
- **Professores**: nome, email, matérias que leciona
- **Turmas**: concurso vinculado, local de aula, turno (M/T/N)
- **Matérias/Disciplinas**: catálogo de disciplinas ofertadas

### Módulo 2 — Grade Horária
- Montagem semanal da grade pelo coordenador
- Cada slot: dia da semana + turno + professor + matéria + carga horária
- Um professor pode aparecer em múltiplas turmas na mesma semana
- Turnos: Matutino (M), Tarde (T), Noturno (N)

### Módulo 3 — Tirinhas e Envio
- Geração automática da tirinha individual por professor
- Visualização da tirinha antes do envio
- Envio de email com um clique (individual ou em massa)

### Módulo 4 — Relatórios
- Carga horária por professor no mês
- Visão geral de aulas por turma

## Entidades de Dados

### Professor
- ID, nome completo, email, matérias vinculadas, ativo/inativo

### Turma
- ID, nome do concurso, código (ex: PMSAC-4098), data de início, local, turno, status

### Matéria
- ID, nome, carga horária total

### Aula (slot da grade)
- ID, turma, professor, matéria, dia da semana, turno, horário início/fim, carga horária, semana de referência

### Semana de Grade
- ID, data início, data fim, status (rascunho/publicada)

## Integrações
- **Email**: envio automático para professores (SMTP ou serviço de email)
- **Supabase Auth**: login para coordenadores e professores

## Stack Definida
- **Frontend**: Next.js 14 (App Router)
- **Backend/DB**: Supabase (PostgreSQL + Auth)
- **Deploy**: Vercel
- **Versionamento**: GitHub

## Fluxo Principal
1. Abre edital → coordenador cria nova turma
2. Coordenador monta a grade da semana
3. Sistema gera tirinhas automaticamente
4. Coordenador revisa e clica "Enviar para todos"
5. Professores recebem email com sua tirinha
6. Gestor acessa relatório de horas quando precisar
