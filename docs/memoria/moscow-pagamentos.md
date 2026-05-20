# Priorização MoSCoW — Módulo de Pagamentos
**Projeto:** Grade Horária IMP
**Data:** 2026-05-19
**Responsável:** Henrique Dantas

---

## 🔴 MUST HAVE (Primeira Versão)

- [x] F1 — Campo `valor_hora_aula` (R$) no cadastro de cada professor
- [x] F2 — Tela de pagamentos com cálculo semanal (valor hora × horas dadas na semana)
- [x] F3 — Tela de pagamentos com cálculo mensal (valor hora × horas dadas no mês)
- [x] F4 — Relatório geral imprimível com valores em R$
- [x] F6 — Envio de resumo de pagamento por email ao professor (formato simples, sem PDF)
- [x] F7 — Marcar professor como "Pago" no período (semanal ou mensal)

## 🟡 SHOULD HAVE (Próxima iteração)

- [ ] F5 — Recibo formal individual com layout de documento (PDF)

## 🟢 COULD HAVE
- [ ] Histórico completo de pagamentos por professor
- [ ] Exportação CSV/Excel

## ⚫ WON'T HAVE (Futuro)
- [ ] Portal do professor para consultar próprio histórico
- [ ] Integração com folha de pagamento

---

## Regras de Negócio

- Fórmula: `total_valor = valor_hora_aula × horas_dadas`
- Somente aulas com `realizada = true` entram no cálculo
- Cada professor tem seu próprio `valor_hora_aula` cadastrado
- Períodos: semanal (seg–sáb) e mensal
- Acesso: apenas coordenação interna
- Email: resumo simples com nome, período, horas, valor hora e total (sem PDF)
- Status de pagamento: `pendente` ou `pago` por período
