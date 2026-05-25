# Manual do Usuário — Grade Horária IMP

**Sistema:** Grade Horária IMP Concursos
**Versão:** 1.0
**Data:** 2026-05-20
**Perfis:** Coordenador | Diretor

---

## Sumário

1. [Acesso ao Sistema](#1-acesso-ao-sistema)
2. [Painel Inicial (Dashboard)](#2-painel-inicial-dashboard)
3. [Professores](#3-professores)
4. [Matérias](#4-matérias)
5. [Turmas e Grade Horária](#5-turmas-e-grade-horária)
6. [Tirinhas (Envio de E-mail)](#6-tirinhas-envio-de-e-mail)
7. [Pagamentos *(somente Diretor)*](#7-pagamentos-somente-diretor)
8. [Relatórios](#8-relatórios)
9. [Perfis e Permissões](#9-perfis-e-permissões)

---

## 1. Acesso ao Sistema

**URL:** https://grade-horaria-imp.vercel.app

Na tela de login, informe seu e-mail e senha cadastrados. O sistema redireciona automaticamente para o painel de acordo com o seu perfil (Coordenador ou Diretor).

> Se você esquecer a senha, entre em contato com o administrador do sistema para redefinição pelo painel do Supabase.

---

## 2. Painel Inicial (Dashboard)

Ao entrar, você verá:

| Elemento | O que mostra |
|----------|-------------|
| **Banner** | Fotos da unidade IMP com a data atual |
| **Professores Ativos** | Quantidade de professores com status ativo |
| **Turmas Ativas** | Turmas com status "ativa" |
| **Matérias** | Total de matérias cadastradas |
| **Aulas esta semana** | Quantidade de aulas lançadas na semana atual |
| **Concluído no mês** | % de aulas marcadas como realizadas no mês |
| **Acesso Rápido** | Atalhos para todos os módulos |

Os números animam do zero até o valor real a cada carregamento — isso confirma que os dados estão sendo lidos em tempo real do banco.

---

## 3. Professores

**Caminho:** Menu lateral → Professores

### Cadastrar novo professor
1. Clique em **Nova Turma**
2. Preencha: Nome, E-mail, Valor Hora/Aula (R$)
3. Clique em **Salvar**

### Vincular matérias ao professor
Na listagem, clique na seta (→) ao lado do professor para abrir o detalhe. Na aba **Disciplinas**, clique em **+ Adicionar Disciplina** e selecione a matéria.

### Editar professor
Clique no ícone de lápis na linha do professor desejado.

### Desativar / Excluir professor
Clique no ícone de lixeira. O sistema pede confirmação dupla — clique novamente para confirmar.

> Professores excluídos são removidos permanentemente. Se preferir apenas inativá-los, use a edição e desmarque o campo "Ativo".

---

## 4. Matérias

**Caminho:** Menu lateral → Matérias

### Cadastrar matéria
1. Clique em **Nova Matéria**
2. Digite o nome (ex: *Direito Constitucional*)
3. Clique em **Salvar**

### Editar / Excluir
Use os ícones de lápis e lixeira na linha correspondente. A exclusão também exige confirmação dupla.

---

## 5. Turmas e Grade Horária

**Caminho:** Menu lateral → Grade Horária

### Criar turma
1. Clique em **Nova Turma**
2. Preencha: Código (ex: PMSAC-4098), Concurso, Local, Turno e Data de Início
3. Clique em **Salvar**

**Turnos disponíveis:** Matutino (M), Tarde (T), Noturno (N)

### Montar a grade semanal
1. Na lista de turmas, clique na seta (→) para abrir o detalhe da turma
2. Selecione a semana desejada com as setas **‹** e **›**
3. Clique em **+ Nova Aula**
4. Preencha: Professor, Matéria, Dia da semana, Turno, Horário de início, Horário de fim e Carga horária
5. Clique em **Salvar**

### Marcar aula como realizada
Na grade montada, cada slot tem um botão de check (✓). Clique nele para alternar entre **Pendente** e **Realizada**. O status é salvo automaticamente.

### Editar / Excluir aula
Use os ícones de lápis e lixeira em cada slot da grade.

---

## 6. Tirinhas (Envio de E-mail)

**Caminho:** Menu lateral → Tirinhas

As "tirinhas" são e-mails enviados a cada professor com a grade semanal personalizada dele.

### Enviar para todos os professores da semana
1. Selecione a semana com as setas **‹** e **›**
2. Confira a lista de professores com aula naquela semana
3. Clique em **Enviar para todos**

### Enviar para um professor específico
Na linha do professor, clique no botão **Enviar**.

> O sistema só mostra professores que têm aulas lançadas na semana selecionada. Se a lista estiver vazia, monte primeiro a grade na aba "Turmas".

O resultado do envio aparece em uma caixa verde (sucesso) ou laranja (parcial) logo abaixo da lista.

---

## 7. Pagamentos *(somente Diretor)*

**Caminho:** Menu lateral → Pagamentos

Este módulo é visível apenas para usuários com perfil **Diretor**.

### Visão Geral (KPIs)
No topo da página há 4 indicadores do período selecionado:
- **Total a Pagar** — soma de todos os valores calculados
- **Total de Horas** — horas realizadas no período
- **Professores** — quantidade de professores com horas no período
- **Pagos** — quantos já foram marcados como pagos

### Alternar entre Semanal e Mensal
Use as abas **Semanal** e **Mensal** no topo. Navegue entre períodos com as setas **‹** e **›**.

### Cálculo
O valor é calculado automaticamente: `horas realizadas × valor hora/aula do professor`.
Somente aulas com status **Realizada** entram no cálculo.

### Marcar como Pago
Na linha do professor, clique em **Marcar Pago**. O botão fica verde e exibe "Pago ✓".

### Enviar comprovante por e-mail
Clique em **Enviar E-mail** na linha do professor. O sistema envia automaticamente um resumo com nome, período, horas, valor por hora e total.

> O e-mail é enviado para o endereço cadastrado na ficha do professor.

---

## 8. Relatórios

**Caminho:** Menu lateral → Relatórios

Quatro abas disponíveis:

| Aba | Conteúdo |
|-----|----------|
| **Professores** | Horas lançadas vs. realizadas por professor, com filtros de mês, turma e professor |
| **Por Turma** | Progresso de cada disciplina dentro da turma (barra percentual) |
| **Grade Completa** | Grid visual da semana — dias × horários com todos os slots |
| **Por Matéria** | Total de horas por matéria, com quais professores lecionaram e em quais turmas |

### Imprimir relatório
Clique no botão **Imprimir** no canto superior direito. A página é formatada automaticamente para impressão (cores removidas, layout ajustado).

---

## 9. Perfis e Permissões

| Funcionalidade | Coordenador | Diretor |
|----------------|:-----------:|:-------:|
| Dashboard | ✓ | ✓ |
| Professores | ✓ | ✓ |
| Matérias | ✓ | ✓ |
| Grade Horária | ✓ | ✓ |
| Tirinhas | ✓ | ✓ |
| Relatórios | ✓ | ✓ |
| **Pagamentos** | ✗ | **✓** |

### Sair do sistema
Clique em **Sair** na parte inferior do menu lateral.

---

*Dúvidas ou problemas? Entre em contato com a equipe técnica responsável pelo sistema.*
