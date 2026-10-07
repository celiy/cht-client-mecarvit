# Campos de formulário (`entityFields.ts`)

**Arquivo:** `src/js/entityFields.ts`

Descrição dos campos dos formulários de cada entidade e funções que preparam os valores para enviar à API. Os campos usam o tipo `FormField` do `cht-shared`, que o `FormRenderer` do design system sabe desenhar.

## Campos por entidade

| Função | Entidade | O que define |
| --- | --- | --- |
| `enderecoFormFields()` | Endereço | CEP, estado, cidade, bairro, rua e número obrigatórios; complemento opcional. |
| `clienteFormFields(opções)` | Cliente | Documento (CPF ou CNPJ; somente leitura depois de criado), nome, nome social (só para CNPJ), e-mail, celular, observação, seleção de endereços (busca externa por rua, com ação de cadastrar) e de veículos, e **Ativo** (só na edição). |
| `veiculoFormFields(opções)` | Veículo | Cliente (só aparece quando a opção `showCliente` está ligada, com busca por nome), modelo, placa, tipo, chassi, quilometragem, data da troca de óleo e **Ativo** (só na edição). |
| `registroFormFields(opções)` | Lançamento financeiro | Tipo (entrada ou saída), nome, valor, prazo de pagamento, valor pago (opcional, somente leitura) e descrição. Pode travar o tipo e o valor quando o lançamento vem de uma OS. |

O campo **Ativo** é um interruptor com a explicação "Quando desativado, a entidade não será indexada nem poderá ser usada. Isso funciona como exclusão lógica, sem perder os dados.".

## Preparar valores para a API

| Função | Regra |
| --- | --- |
| `optionalTextForSave(valor, criando)` | Texto aparado; se vazio, **limpa** (`null`) na edição e **omite** (`undefined`) no cadastro. |
| `optionalPhoneForSave(valor, criando)` | O mesmo, mas guarda só os dígitos. |
| `clienteNomeSocialForSave(documento, nome, criando)` | Só envia nome social quando o documento é CNPJ. |
| `veiculoOptionalFields(valores, { clearEmpty })` | Monta `chassi`, `kilometragem`, `dataTrocaOleo` e `tipo` apenas com o que foi preenchido; com `clearEmpty` (edição), campos vazios viram `null`. |
| `emptyVeiculoFormExtras()`, `veiculoExtrasFromApi(veiculo)` | Valores iniciais dos campos extras do veículo, vazios ou vindos da API. |
| `dateToInputValue(valor)` | Converte data da API (texto, número ou `Date`) em `aaaa-mm-dd` para os campos de data. Aceita segundos ou milissegundos. |

A diferença entre "limpar" e "omitir" importa porque a API trata `null` como "apagar o valor" e a ausência do campo como "não mexer".
