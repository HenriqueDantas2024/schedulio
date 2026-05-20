# As-Built — Grade Horária IMP

**Versão:** 1.0 (produção)
**Data de entrega:** 2026-05-20
**URL de produção:** https://grade-horaria-imp.vercel.app
**Repositório:** https://github.com/HenriqueDantas2024/grade-horaria-imp

---

## O Que É Este Sistema

O **Grade Horária IMP** é um sistema web de gestão de grade horária para o IMP Concursos. Substitui um processo manual baseado em planilhas Excel com 29 abas, eliminando cópia-cola e envio artesanal de e-mails para ~60 professores semanalmente.

O sistema foi construído do zero em 5 dias de desenvolvimento ativo, passando por 7 fases de implementação, QA e auditoria de segurança antes do deploy em produção.

---

## Funcionalidades Entregues

### Módulo de Professores
- Cadastro completo com nome, e-mail, status ativo/inativo e valor hora/aula (R$)
- Vínculo de matérias por professor
- Listagem com busca, edição inline e exclusão com confirmação dupla

### Módulo de Matérias
- Cadastro e listagem de disciplinas
- Vínculo com professores e turmas

### Módulo de Turmas e Grade Horária
- Cadastro de turmas com código, concurso, local, turno e data de início
- Montagem semanal da grade por turma: professor + matéria + dia + turno + horário + carga horária
- Controle de aula realizada/pendente por slot (toggle)
- Navegação semanal com setas de avançar/retroceder
- Aba separada de disciplinas por turma

### Módulo de Tirinhas (E-mail)
- Listagem automática de professores com aulas na semana
- Envio individual ou em massa da grade semanal personalizada
- Template HTML responsivo enviado via Resend
- Feedback visual do resultado (enviados / falhas)

### Módulo de Relatórios
- 4 abas: por Professor, por Turma, Grade Completa, por Matéria
- Filtros por mês, turma e professor
- Barras de progresso percentual
- Grid visual semanal (dias × horários)
- Impressão otimizada com CSS @media print

### Módulo de Pagamentos *(somente Diretor)*
- KPIs: total a pagar, horas realizadas, professores, pagos
- Visão semanal e mensal com navegação por período
- Cálculo automático: horas realizadas × valor hora/aula
- Marcar professor como pago por período
- Envio de comprovante por e-mail ao professor
- Acesso restrito por perfil (role-based + RLS no banco)

### Dashboard
- Hero slideshow com fotos da unidade IMP
- 5 KPIs em tempo real com animação de contador
- Acesso rápido a todos os módulos

### Infraestrutura e Segurança
- Autenticação com Supabase Auth (JWT + cookies HttpOnly)
- Row Level Security (RLS) em todas as tabelas do banco
- Proteção adicional de rotas via `proxy.ts`
- Headers de segurança HTTP: X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, COEP
- Perfis de acesso: Coordenador (acesso padrão) e Diretor (acesso total)
- Trigger automático que cria perfil `coordenador` para novos usuários

---

## Arquitetura Resumida

```
Next.js 16 (App Router) + TypeScript
    ↓
Vercel (CDN + deploy automático via push na branch main)
    ↓
Supabase (PostgreSQL + Auth + RLS)
    ↓
Resend (e-mails transacionais)
```

---

## Design System

Identidade visual baseada na marca IMP Concursos:

| Token | Valor | Uso |
|-------|-------|-----|
| Navy | #1A1F36 | Textos principais, sidebar |
| Primary | #E8193C | Vermelho IMP — botões, destaques |
| Background | #F8F9FC | Fundo da aplicação |
| Surface | #FFFFFF | Cards e tabelas |
| Border | #E2E8F0 | Bordas e divisores |

Ícones: **Phosphor Icons** (fill no item ativo, regular nos demais)
Notificações: **Sonner** (toasts não bloqueantes com richColors)
Animações: contadores ease-out cúbico, shimmer skeletons, hover com translateY + inset shadow

---

## Histórico de Desenvolvimento

| Fase | Descrição | Status |
|------|-----------|--------|
| 01 — Fundação | Setup Next.js, Supabase, Vercel, design tokens, autenticação | ✅ Completo |
| 02 — Cadastros | Professores, Turmas, Matérias | ✅ Completo |
| 03 — Grade Horária | Montagem semanal, slots, toggle realizada | ✅ Completo |
| 04 — Tirinhas | Envio de e-mail individual e em massa | ✅ Completo |
| 05 — Relatórios | 4 abas de relatório + impressão | ✅ Completo |
| 06 — Produção | QA (Ravena), auditoria (Kerberos), deploy | ✅ Completo |
| 07 — Pagamentos | Módulo financeiro restrito ao Diretor | ✅ Completo |
| 08 — Performance | Navegação client-side, queries paralelas, imagens WebP | ✅ Completo |
| 09 — UI Premium | Phosphor Icons, Sonner, contadores animados, skeletons | ✅ Completo |

---

## Limitações Conhecidas

| Item | Descrição | Impacto |
|------|-----------|---------|
| Recuperação de senha | Não há fluxo self-service de reset de senha na UI | Baixo — feito manualmente pelo admin no Supabase |
| Recibo PDF | Comprovante de pagamento é enviado como e-mail HTML, não como PDF | Baixo — funcional para o uso atual |
| Histórico de pagamentos | Não há visualização histórica completa por professor | Baixo — dados estão no banco, falta interface |
| Exportação CSV | Relatórios não têm botão de exportar | Baixo — dados acessíveis via Supabase direto |

---

## Backlog Priorizado (Próximas Iterações)

### Should Have
- [ ] **Recibo PDF** — gerar PDF do comprovante de pagamento via biblioteca como `@react-pdf/renderer`
- [ ] **Reset de senha** — página de recuperação de senha self-service

### Could Have
- [ ] **Histórico de pagamentos** — listagem completa por professor com filtros
- [ ] **Exportação CSV** — botão de exportar nos relatórios
- [ ] **Portal do professor** — acesso restrito para o professor ver sua própria grade e histórico

### Won't Have (versão atual)
- Integração com folha de pagamento contábil
- App mobile nativo
- Notificações push

---

## Credenciais e Acessos

| Recurso | Onde encontrar |
|---------|---------------|
| Supabase (banco + auth) | Dashboard Supabase — projeto `grade-horaria-imp` |
| Vercel (deploy + logs) | Dashboard Vercel — projeto `grade-horaria-imp` |
| Resend (e-mails) | Dashboard Resend — domínio configurado |
| GitHub (código) | github.com/HenriqueDantas2024/grade-horaria-imp |

Para criar novos usuários Diretor:
```sql
-- No Supabase SQL Editor, após criar o usuário via Authentication:
UPDATE perfis SET role = 'diretor'
WHERE id = (SELECT id FROM auth.users WHERE email = 'email@dominio.com');
```

---

## Métricas do Projeto

| Métrica | Valor |
|---------|-------|
| Dias de desenvolvimento | ~5 dias |
| Fases concluídas | 9 de 9 |
| Linhas de código | ~4.300 |
| Arquivos criados | 41 |
| Tabelas no banco | 8 |
| API Routes | 2 |
| Componentes UI reutilizáveis | 5 |
| Hooks customizados | 2 |
