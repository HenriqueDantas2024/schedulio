# Grade Horária IMP — As Built

**Descrição:** Sistema web de gestão de grade horária para o IMP Concursos. Substitui planilhas manuais com 29 abas, eliminando copia-cola e envio artesanal de emails para ~60 professores.
**Stack:** GitHub + Supabase + Vercel + Next.js 14
**Última atualização:** 2026-05-15

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
**Status:** `⏳ Aguardando`
**Progresso:** 0/3 tarefas (0%)

#### Tarefas:
- [ ] Tela de cadastro e listagem de Professores
- [ ] Tela de cadastro e listagem de Turmas
- [ ] Tela de cadastro de Matérias/Disciplinas

---

### 🟠 FASE 03: GRADE HORÁRIA
**Status:** `⏳ Aguardando`
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] Interface de montagem da grade semanal por turma
- [ ] CRUD de slots (dia + turno + professor + matéria + horário + carga horária)
- [ ] Suporte a professor em múltiplas turmas na mesma semana
- [ ] Visualização geral da grade montada

---

### 🔴 FASE 04: TIRINHAS E EMAIL
**Status:** `⏳ Aguardando`
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] Geração automática da tirinha individual por professor
- [ ] Preview da tirinha antes do envio
- [ ] Envio com um clique (individual ou em massa)
- [ ] Template de email com tirinha formatada

---

### 🟣 FASE 05: RELATÓRIOS
**Status:** `⏳ Aguardando`
**Progresso:** 0/2 tarefas (0%)

#### Tarefas:
- [ ] Relatório de horas por professor no mês
- [ ] Filtros por período e professor

---

### ✅ FASE 06: PRODUÇÃO
**Status:** `⏳ Aguardando`
**Progresso:** 0/4 tarefas (0%)

#### Tarefas:
- [ ] QA completo com Ravena
- [ ] Auditoria de segurança com Kerberos
- [ ] Deploy final na Vercel (main)
- [ ] Sistema em produção

---

## Backups e Segurança
| Data | Tag | Tipo | Status |
|------|-----|------|--------|
| — | — | — | — |

## Histórico de Sessões
| Data | O que foi feito |
|------|----------------|
| 2026-05-15 | Especificação completa com Shiva. Roadmap criado com Hades. Fase 01 iniciada. |
