# Editor de pagamentos (`PagamentosEditor`)

**Arquivo:** `src/components/PagamentosEditor.vue`

Edita a lista de pagamentos de um lançamento financeiro ou de uma OS. É o conteúdo do [modal de pagamentos](./modal-de-pagamentos.md); também pode ser usado direto em um formulário.

## O que mostra

1. **Resumo** (se recebe `valorTotal`): o valor total e quanto já foi pago.
2. **Lista de pagamentos**: tipo, valor e, quando existem, a data do último registro. Em modo editável cada linha tem os botões **Editar pagamento**, **Cancelar edição** e **Remover pagamento**.
3. **Formulário** (se não é `readonly`): **Tipo** (Dinheiro, PIX, Crédito, Débito, Boleto, Transferência, Cheque, Outro; padrão PIX) e **Valor**, com o botão **Adicionar pagamento** (ou **Aplicar alteração** durante a edição de uma linha) e **Cancelar**.

## Regras

- O valor precisa ser maior que zero ("Informe o tipo e um valor maior que zero.").
- Quando `valorTotal` existe, a soma dos pagamentos não pode passar dele ("A soma dos pagamentos não pode ser maior que o valor do lançamento."). Ao editar uma linha, o valor antigo dela não conta na soma. A tolerância é de menos de um centavo.
- Editar uma linha mantém o `id` e as datas dela, para o servidor saber que é o mesmo pagamento.

## Props, evento e método

| Prop | Função |
| --- | --- |
| `rows` | Pagamentos atuais (`PagamentoFormRow`: `id?`, `tipo`, `valor`, `criadoEm?`, `modificadoEm?`). |
| `valorTotal` | Valor do lançamento, para o resumo e para o limite. |
| `readonly` | Só leitura, sem formulário. |
| `saving` | Estado de salvamento. |

Evento `update:rows`: lista nova a cada adição, edição ou remoção. Método exposto `pagamentosPayload()`: devolve a lista pronta para a API (`{ id?, tipo, valor }` com valor numérico).

O servidor repete a conferência de soma e tipo (ver [pagamentos no backend](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/entidades/registros-financeiros.md)).
