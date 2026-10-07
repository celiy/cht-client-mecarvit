# Entradas e saídas

**Arquivo:** `src/pages/financeiro/entradas-saidas.vue` · **Rota:** `/registro-entrada-saida` · **API:** `/api/regentradasaida` (e `/api/ordem-servico` para os pagamentos de entradas de OS)

O financeiro da oficina. Duas seções na mesma página, **Entradas** (dinheiro recebido: vendas, serviços e outros) e **Saídas** (dinheiro pago), cada uma com seu filtro, sua tabela e sua paginação. Aparece no menu para quem tem `financeiro.editar`.

## Seções

Os links do menu levam a `#entradas` e `#saidas`; ao chegar com esse hash a página rola até a seção. O hash também define o **tipo padrão** de um novo lançamento (entrada ou saída). Cada seção tem um botão de exportar PDF próprio (`financeiro.exportar`); o botão do topo exporta as duas.

## Tabela (as duas seções)

| Coluna | Observação |
| --- | --- |
| Nome | |
| Valor | Valor total do lançamento, em reais. |
| Pago | Soma dos pagamentos. |
| Pagamento | Selo: Pago, A vencer, Não pago ou Atrasado, com a data de pagamento como dica. |

**Filtros das entradas:** Nome (padrão), Data de pagamento, Ordem de serviço (seleção múltipla com busca por número) e Status de pagamento. **Filtros das saídas:** Nome (padrão), Data de pagamento e Status de pagamento.

**Ações da linha:** Visualizar, Editar, **Pagamentos** e, com `financeiro.excluir`, Excluir. **Cadastrar** exige `financeiro.criar`.

## Formulário do lançamento

| Campo | Regra |
| --- | --- |
| Tipo | Entrada ou saída. Obrigatório. |
| Nome | Obrigatório. |
| Valor | Dinheiro, maior que zero. |
| Data limite de pagamento | Opcional. Vazio significa sem prazo. |
| Valor pago | Só leitura; mostra a soma dos pagamentos (fora do cadastro). |
| Descrição | Texto livre. |

Além dos campos, o modal permite lançar **pagamentos**. Sem lançamento criado ainda, os pagamentos ficam na tela e vão junto no `POST`; com o lançamento criado, o modal de pagamentos salva direto.

## Entradas geradas por ordem de serviço

Uma entrada criada por uma [OS](./ordens-de-servico.md) (o nome segue `dd/mm/aaaa - OS #id`) tem o **tipo e o valor travados**: o valor é a soma dos itens da OS e só muda alterando a OS. A tela mostra um acesso para abrir a OS ligada (em um modal de leitura, com o formulário de OS e o ver pagamentos). O prazo e os pagamentos continuam editáveis. Excluir uma entrada de OS é recusado pelo servidor.

## Pagamentos

A ação **Pagamentos** da linha abre o [modal de pagamentos](../componentes/modal-de-pagamentos.md) com o total do lançamento e a soma já paga. Para uma entrada de OS, o salvamento vai para `PUT /api/ordem-servico/{id}`; para os demais, para `PUT /api/regentradasaida/{id}`. Depois recarrega as duas seções.

## Salvar e excluir

- **Salvar**: `POST /api/regentradasaida` (novo) ou `PUT /api/regentradasaida/{id}`, com `tipo`, `nome`, `descricao`, `dataLimitePagamento`, `valor` (omitido se travado) e `pagamentos`.
- **Excluir**: `DELETE /api/regentradasaida/{id}`; recarrega entradas e saídas.
