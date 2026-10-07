# Filtros (`FilterInputs`)

**Arquivo:** `src/components/FilterInputs.vue`

Barra de filtros de uma lista. Cada filtro é descrito por um objeto (`FilterDef`) e o componente cuida de mostrar o campo, lembrar o valor e avisar a página.

## Tipos de filtro

| `type` | Como aparece | Valor enviado |
| --- | --- | --- |
| `input` | Campo de texto. Aceita `inputType` (`cpf`, `cnpj`, `email`, `phone`, `cep`, `number`, `money`, `date`, …); sem ele, deduz pelo nome (`cpf`, `cnpj`, `email`, `phone`, `cep`) ou usa texto. | O texto. CPF, CNPJ, telefone e CEP vão só com dígitos. |
| `select` | Seleção, simples ou múltipla (`multiple`), com busca externa opcional (`search.external` e `search.field`). | Valores separados por vírgula. |
| `option` | Grupo de escolhas exclusivas (por exemplo, Status: Ativo/Inativo). O `default` da opção vale até o usuário trocar. | O valor da escolha. |

`default: true` faz o filtro aparecer de início. Os demais ficam no botão de filtros (um menu) e o usuário os liga quando precisa.

## Como funciona

- **Layout.** À esquerda, um botão de recarregar (o ícone gira enquanto `loading`). À direita, os filtros ativos, um botão **Limpar filtros** (aparece quando há algum filtro aplicado diferente do padrão) e o botão de filtros, que abre um menu para ligar ou desligar os filtros que não são padrão. Cada filtro `option` vira um submenu com suas escolhas.
- **Eventos.** `filters` entrega um objeto `{ campo: valor }` só com os filtros ativos e preenchidos; a página transforma isso em query string. `reload` pede para recarregar. `search:external` pede à página para buscar opções de um `select` com busca externa (`filterKey`, `field`, `value`).
- **Espera ao digitar.** Os campos de texto aguardam 280 ms depois da última tecla antes de emitir, para não consultar a API a cada letra. Selects e escolhas emitem na hora.
- **Estado.** Ao receber novas definições, mantém os valores já digitados (`hydrateFromFilters`) e emite os filtros de novo.
- **Opções dinâmicas.** `filterSelectOptions` traz as opções de um select com busca externa, e `selectSearchLoading` mostra o carregamento.

## Props e eventos

`filters` (obrigatória), `loading`, `filterSelectOptions`, `selectSearchLoading` · eventos `filters`, `reload`, `search:external`.
