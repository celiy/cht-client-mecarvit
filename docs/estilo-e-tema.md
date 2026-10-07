# Estilo e tema

## `src/css/style.css`

Arquivo de entrada do Tailwind deste cliente:

- Importa o Tailwind e o plugin de utilitários de borda do base (`borderUtilitiesPlugin.js`).
- Define as variantes `dark` e `light`, que seguem o atributo `data-theme` do documento.
- Declara as fontes que o Tailwind deve varrer em busca de classes: o próprio cliente, o `cht-design-system` e o `cht-shared`.
- Inclui por completo as cores `bg-<cor>-<tom>` da paleta (de 50 a 900), porque algumas telas montam a classe a partir de dados (por exemplo, a cor do status da OS), e o Tailwind não a encontraria no código.

## `src/theme.config.json`

```json
{ "default": "dark", "radius": "xl" }
```

Tema padrão escuro e cantos bem arredondados. O base lê este arquivo para gerar os tokens de cor.

## Tema personalizado

`App.vue` ativa o tema `hodiernus` ao criar. O usuário pode alternar claro/escuro no [menu do usuário](./layout-principal.md#menu-do-usuário).

## Cores de status

O mapeamento de cores de status de OS e de situação de pagamento fica em [`osStatusBadge.ts`](./modulos/status-e-pagamentos.md) e, para o painel, em [`dashboard.ts`](./modulos/painel.md). A tabela e os gráficos usam a mesma cor para o mesmo status.
