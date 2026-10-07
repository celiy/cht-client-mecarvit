# Mapeamento da OS (`ordemServicoFormMap.ts`)

**Arquivo:** `src/js/ordemServicoFormMap.ts`

Converte a OS que a API devolve (`OrdemServicoApi`) para os valores do [formulário de OS](../componentes/formulario-de-os.md) (`OrdemServicoFormValues`).

## `OrdemServicoApi`

Descreve a resposta da API: id, datas, cliente e veículo (com `cliente` e `veiculo` resumidos), diagnósticos, observação, status (`statusOsId` e `status`), `itens`, `pagamentos`, `responsaveis` (CPFs), `total`, `pagamentoSituacao` e o `registroEntradaSaida` gerado, se existir.

## `toOsForm(os, cliente?, veiculo?)`

Monta o formulário. Dá preferência aos dados do cliente e do veículo que a página já carregou e, na falta deles, usa os resumos que vêm dentro da OS. Detalhes:

- Os valores dos itens passam por `moneyAmountToInputDigits`, o formato de dinheiro dos campos.
- A quilometragem zerada ou ausente vira vazio.
- Os responsáveis viram só dígitos.
- As datas viram `aaaa-mm-dd`.

## `osDataLimitePagamento(os)`

Decide qual prazo de pagamento mostrar:

- Se a OS já tem lançamento financeiro (`registroEntradaSaida`), vale o prazo dele, **mesmo que seja `null`**.
- Senão, vale o da própria OS.

Assim, uma edição feita no financeiro não é encoberta por uma cópia antiga na OS. A mesma regra existe no backend.
