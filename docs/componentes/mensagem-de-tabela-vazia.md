# Mensagem de tabela vazia (`EmptyTableMessage`)

**Arquivo:** `src/components/EmptyTableMessage.vue`

Bloco com um ícone de lupa, um título e uma descrição, mostrado no lugar das linhas quando uma tabela não tem resultados. É o que a [lista CRUD](./lista-crud.md) coloca no slot `empty` da tabela, e a tela de [entradas e saídas](../paginas/entradas-e-saidas.md) usa em cada seção.

| Prop | Função |
| --- | --- |
| `title` | Título (obrigatória). Ex.: "Nenhum cliente encontrado." |
| `description` | Descrição (obrigatória). Padrão da lista: "Ajuste os filtros ou cadastre um novo registro." |
