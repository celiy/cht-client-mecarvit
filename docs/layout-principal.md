# Layout principal

`src/layouts/MainLayout.vue` é a moldura de todas as telas logadas. Usa `<script setup>` e renderiza a `Sidebar` do design system com a `RouterView` dentro.

## Estrutura

- **Título e descrição da barra**: o nome da oficina (`$mecarvit.company.nome`) e o texto "Sistema Mecarvit".
- **Barra superior**: o botão de atualização do app desktop (`AppUpdateButton`, do base), à direita.
- **Menu**: `sidebarNavItems(mecarvit.user.nivelAcesso)`, que se recalcula quando o usuário muda. Ver [rotas e navegação](./rotas-e-navegacao.md#menu-lateral-srcjssidebarnavts).
- **Rodapé**: o nome do funcionário, que abre um painel com as ações abaixo.

## Menu do usuário

| Opção | Ação | Visível para |
| --- | --- | --- |
| Ver perfil | Vai para [`/usuario`](./paginas/perfil.md). | Todos |
| Logs do sistema | Vai para [`/logs`](./paginas/logs-do-sistema.md). | Superadmin |
| Mudar tema | Alterna entre escuro e claro (`project.style.theme`). O ícone mostra o tema para o qual vai mudar. | Todos |
| Sair | [`endSession`](./modulos/sessao.md#endsession) e volta ao login. | Todos |
