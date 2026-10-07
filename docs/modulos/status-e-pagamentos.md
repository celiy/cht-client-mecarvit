# Status e pagamentos (`osStatusBadge.ts` e `pagamentoOptions.ts`)

**Arquivos:** `src/js/osStatusBadge.ts` e `src/js/pagamentoOptions.ts`

## Selos de status da OS

| Id | Status | Cor |
| --- | --- | --- |
| 1 | aberta | `info` |
| 2 | pendente | `warning` |
| 3 | em andamento | `blue-500` |
| 4 | concluída | `success` |
| 5 | cancelada | `destructive` |
| 6 | orçamento | `slate-500` |
| 7 | reaberta | `violet-500` |

- `osStatusColor(id)`: a cor do status (cinza para um id desconhecido).
- `osStatusBadge(id, nome)`: o objeto de selo que a tabela entende, `{ badge: { label, color } }`, com o nome em maiúscula inicial.
- `osStatusIndicator(id)`: uma cor CSS para o indicador do menu de status.

As mesmas cores aparecem no gráfico de OS por status do [painel](./painel.md).

## Selos de pagamento

`osPagamentoBadge(situacao, dataLimite)` devolve o selo de situação de pagamento, com a data de pagamento como dica quando existe:

| Situação | Estilo |
| --- | --- |
| Pago | `success` |
| A vencer | `warning` |
| Não pago | `orange-600` |
| Atrasado | `destructive` |

A situação em si é calculada pelo `cht-shared` (`pagamentoSituacao`) e pelo backend.

## Pagamentos (`pagamentoOptions.ts`)

| Item | Função |
| --- | --- |
| `PAGAMENTO_SELECT_OPTIONS` | Tipos de pagamento: dinheiro, PIX, crédito, débito, boleto, transferência, cheque e outro. |
| `PagamentoFormRow` | Uma linha de pagamento no formulário: `id?`, `tipo`, `valor` (texto), `criadoEm?`, `modificadoEm?`. |
| `sumPagamentosValor(lista)` | Soma dos valores, ignorando os inválidos. |
| `pagamentoLabel(tipo)` | Nome amigável do tipo (ou o próprio texto se não conhecido). |
