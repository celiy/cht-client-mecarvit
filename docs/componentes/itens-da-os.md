# Itens da OS (`OrdemServicoItensSection`)

**Arquivo:** `src/components/OrdemServicoItensSection.vue`

A seção "Serviços" do [formulário de OS](./formulario-de-os.md): uma tabela com os serviços feitos, a quantidade e o valor de cada um, mais uma linha de rascunho para acrescentar um item novo.

## Aparência por modo

| Modo | O que mostra |
| --- | --- |
| `view` | Só a lista (serviço, quantidade e valor), ou a mensagem de vazio. |
| `create`, `edit` | Os itens como linhas editáveis, cada uma com o botão de remover, e abaixo a **linha de rascunho** com o botão **+**. |

Colunas: serviço, quantidade (**Qtd.** no celular) e valor. Os valores são mostrados em reais; internamente ficam como texto de dinheiro.

## Linha de rascunho

O usuário preenche serviço, quantidade (padrão 1) e valor, e confirma com o botão **+** ou apertando Enter no último campo. Antes de acrescentar, a linha é validada:

| Campo | Regra |
| --- | --- |
| Serviço | Obrigatório ("Nome do serviço é obrigatório."). |
| Quantidade | Inteiro maior ou igual a 1 ("Quantidade inválida."). |
| Valor | Maior que zero ("Informe o valor."). |

Depois de acrescentar, o rascunho é limpo e o foco volta ao campo de serviço.

### Serviço existente ou novo

O campo de serviço sugere os serviços já cadastrados (busca externa por nome: evento `search:servico`). Escolher uma sugestão grava o `servicoId`; digitar um nome novo deixa o item **sem `servicoId`**, e o backend cria o serviço ao salvar a OS. Quando o nome digitado não corresponde a nenhuma sugestão, a tela avisa: "Pressione Enter para usar este nome.".

### Navegação por teclado

Enter anda entre os campos: serviço → quantidade → valor → acrescenta o item. Quando a lista de sugestões está aberta com uma opção para escolher, o Enter é dela (seleciona e passa para a quantidade); sem opções, o campo avança sozinho. Enter nos campos de itens já confirmados não envia o formulário.

## Props e eventos

| Prop | Função |
| --- | --- |
| `mode` | `create`, `edit` ou `view`. |
| `items` | Lista de itens (`servicoId?`, `servicoNome`, `quantidade`, `valor`, tudo como texto). |
| `errors` | Erros por campo vindos da API. |
| `servicoSuggestions`, `servicoSearchLoading` | Sugestões de serviço e carregamento. |

Eventos: `update:items` (lista nova a cada alteração) e `search:servico` (texto parcial para buscar sugestões).
