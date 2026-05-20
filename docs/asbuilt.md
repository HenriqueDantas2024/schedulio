# Grade Horária IMP — As Built

**Descrição:** Sistema web de gestão de grade horária para o IMP Concursos. Substitui planilhas manuais com 29 abas, eliminando copia-cola e envio artesanal de emails para ~60 professores.
**Stack:** GitHub + Supabase + Vercel + Next.js 16.2.6
**Última atualização:** 2026-05-19

---

## Roadmap de Implementação

### 🔵 FASE 01: FUNDAÇÃO
**Status:** `✅ Completa`
**Progresso:** 7/7 tarefas (100%)

#### Tarefas:
- [x] Criar repositório GitHub com branches dev / hml / main
- [x] Setup projeto Next.js 16.2.6 (App Router + TypeScript + Tailwind)
- [x] Configurar Supabase (projeto + banco de dados + RLS)
- [x] Conectar Vercel ao branch main (deploy automático)
- [x] Aplicar design tokens IMP (cores, tipografia, variáveis CSS)
- [x] Implementar autenticação de coordenadores (Supabase Auth)
- [x] Criar schema do banco de dados (tabelas: professores, turmas, materias, aulas, semanas)

**Notas:** Windows 11. Next.js 16 usa proxy.ts (não middleware.ts). GitHub: github.com/HenriqueDantas2024/grade-horaria-imp | Vercel: grade-horaria-imp.vercel.app
**Último trabalho:** 2026-05-15 — Auth completa, login page com identidade IMP, proxy de proteção de rotas, deploy na Vercel

---

### 🟡 FASE 02: CADASTROS
**Status:** `✅ Completa`
**Progresso:** 3/3 tarefas (100%)

#### Tarefas:
- [x] Tela de cadastro e listagem de Professores (com vínculo de matérias)
- [x] Tela de cadastro e listagem de Turmas (com disciplinas e professores por turma)
- [x] Tela de cadastro de Matérias/Disciplinas

---

### 🟠 FASE 03: GRADE HORÁRIA
**Status:** `✅ Completa`
**Progresso:** 4/4 tarefas (100%)

#### Tarefas:
- [x] Interface de montagem da grade semanal por turma (TabGrade)
- [x] CRUD de slots (dia + turno + professor + matéria + horário + carga horária)
- [x] Controle de aula realizada (toggle realizada/pendente por slot)
- [x] Visualização geral da grade montada

---

### 🔴 FASE 04: TIRINHAS E EMAIL
**Status:** `✅ Completa`
**Progresso:** 4/4 tarefas (100%)

#### Tarefas:
- [x] Listagem de professores com aulas na semana selecionada
- [x] Envio individual e em massa da grade semanal por email (Resend)
- [x] Navegação por semana
- [x] API route /api/enviar-tirinhas

---

### 🟣 FASE 05: RELATÓRIOS
**Status:** `✅ Completa`
**Progresso:** 4/4 tarefas (100%)

#### Tarefas:
- [x] Aba Professores — horas lançadas vs dadas, filtros mês/turma/professor
- [x] Aba Por Turma — progresso por disciplina com barra %
- [x] Aba Grade Completa — grid semanal dias × horários
- [x] Aba Por Matéria — horas por matéria com professores e breakdown por turma
- [x] Impressão (botão Imprimir + CSS @media print)

---

### ✅ FASE 06: PRODUÇÃO
**Status:** `✅ Completa`
**Progresso:** 4/4 tarefas (100%)

#### Tarefas:
- [x] QA completo com Ravena (nav, aria-labels, tirinhas, grade)
- [x] Auditoria de segurança com Kerberos (headers HTTP, RLS confirmado)
- [x] Deploy na Vercel — grade-horaria-imp.vercel.app
- [x] Dashboard redesenhado (hero slideshow, KPIs em tempo real, logo IMP)

---

### 🆕 FASE 07: MÓDULO DE PAGAMENTOS
**Status:** `✅ Completa`
**Progresso:** 5/5 tarefas (100%)

#### Tarefas:
- [x] Migration: campo valor_hora_aula em professores + tabela pagamentos
- [x] Atualizar UI de Professores com campo valor hora/aula
- [x] Página /dashboard/pagamentos (abas Semanal e Mensal)
- [x] API route /api/enviar-pagamento (email de resumo)
- [x] Nav item Pagamentos na sidebar

---

## Backups e Segurança
| Data | Tag | Tipo | Status |
|------|-----|------|--------|
| — | — | — | — |

## Histórico de Sessões
| Data | O que foi feito |
|------|----------------|
| 2026-05-15 | Especificação completa com Shiva. Roadmap criado com Hades. Fase 01 iniciada. |
| 2026-05-15–18 | Fases 02–06 completas. Sistema em produção. Seed dados SEDES/DF. |
| 2026-05-19 | Shiva especificou módulo de pagamentos (MoSCoW). Hades planejou Fase 07. |
| 2026-05-19 | Atlas implementou Fase 07 completa: migration, UI professores, /dashboard/pagamentos, API email, nav. Deploy em produção. |
