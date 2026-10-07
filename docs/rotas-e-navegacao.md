# Rotas e navegação

## Mapa de rotas (`src/routes.ts`)

| Caminho | Nome | Página | Proteção (`meta`) |
| --- | --- | --- | --- |
| `/login` | `login` | [Login](./paginas/login.md) | `guestOnly` |
| `/register` | `register` | [Cadastro da oficina](./paginas/cadastro-da-oficina.md) | `guestOnly` |
| `/trocar-senha` | `change-password` | [Trocar senha](./paginas/trocar-senha.md) | `requiresAuth` |
| `/` | — | Moldura [`MainLayout`](./layout-principal.md), `requiresAuth` | |
| `/` → `/home` | `index` | Redireciona | |
| `/home` | `home` | [Painel inicial](./paginas/painel-inicial.md) | |
| `/usuario` | `usuario` | [Perfil](./paginas/perfil.md) | |
| `/logs` | `audit-logs` | [Logs do sistema](./paginas/logs-do-sistema.md) (carregada sob demanda) | `requiresSuperadmin` |
| `/funcionarios` | `funcionarios` | [Funcionários](./paginas/funcionarios.md) | |
| `/clientes` | `clientes` | [Clientes](./paginas/clientes.md) | |
| `/veiculos` | `veiculos` | [Veículos](./paginas/veiculos.md) | |
| `/ordem-servico` | `ordem-servico` | [Ordens de serviço](./paginas/ordens-de-servico.md) | |
| `/registro-entrada-saida` | `registro-entrada-saida` | [Entradas e saídas](./paginas/entradas-e-saidas.md) | |
| qualquer outra | `not-found` / `not-found-public` | `NotFoundPage` do design system, com link para `/home` | |

As telas filhas de `/` aparecem dentro do [layout principal](./layout-principal.md), com `requiresAuth` herdado. O guarda que aplica essas regras está em [bootstrap e sessão](./bootstrap-e-sessao.md#setupauthguardrouter).

A rota de cada área (por exemplo `/clientes`) existe para todo usuário logado: quem não tem permissão simplesmente não vê o item no menu, e a API recusa as chamadas com 403.

## Menu lateral (`src/js/sidebarNav.ts`)

`sidebarNavItems(nivelAcesso)` monta as entradas da barra lateral a partir do cargo. Cada grupo exige uma chave de acesso, a mesma que as rotas do backend exigem, de modo que **o menu nunca oferece uma página que responderia 403**:

| Seção | Grupo | Chave exigida | Links |
| --- | --- | --- | --- |
| Início | Dashboard | — | `/home` |
| Cadastros | Funcionários | `funcionarios.editar` | Gerenciar, Cadastrar |
| Cadastros | Clientes | `clientes.editar` | Gerenciar, Cadastrar |
| Cadastros | Veículos | `veiculos.editar` | Gerenciar, Cadastrar |
| Ordens de serviço | Ordens de serviço (aberto por padrão) | `os.editar` | Gerenciar, Cadastrar |
| Financeiro | Entradas e saídas (aberto por padrão) | `financeiro.editar` | Gerenciar, Entradas (`#entradas`), Saídas (`#saidas`), Cadastrar |

- Uma seção sem nenhum item acessível some inteira, inclusive o título.
- O link **Cadastrar** leva a `…?cadastrar=true`, que abre o modal de cadastro ao chegar. Ele some para quem tem `editar` mas não tem `criar` na área.
- Os links `#entradas` e `#saidas` da tela financeira rolam até a seção e definem o tipo padrão do cadastro.
