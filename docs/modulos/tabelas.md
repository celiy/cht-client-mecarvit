# Apoio às tabelas

Funções pequenas que preparam o conteúdo das células.

## `formatTableLabel` (`formatTableLabel.ts`)

Põe a primeira letra em maiúscula (`pt-BR`) para exibir nomes de status ("em andamento" → "Em andamento"). Texto vazio vira "—".

## Células sensíveis (`sensitiveTableCell.ts`)

CPF e documento aparecem **mascarados** nas tabelas, com um botão que revela o valor.

- `cpfToggleCell(cpf)` e `documentoToggleCell(documento)` devolvem `{ value, altValue, buttonProps }`: o valor mascarado, o valor completo formatado e as propriedades do botão (discreto e pequeno).
- `unwrapToggleCell(célula)` extrai o valor completo de uma célula desse tipo, ou o próprio valor se não for uma célula especial. As páginas usam para trabalhar com o CPF real a partir de uma linha da tabela.

As máscaras (`maskCpfDisplay`, `formatCpfDisplay`…) vêm do `cht-shared`.

## Endereços (`enderecoLabel.ts`)

- `enderecoOptionLabel(endereco)`: texto de uma opção de endereço, `rua, número · bairro` (sem número, usa `s/n`).
- `uniqueEnderecoIds(ids)`: converte ids em texto em números inteiros positivos, sem repetição.

## Ordenação

A tradução do clique no cabeçalho para o parâmetro `sort` está em [listas e HTTP](./crud-http.md#ordenação).
