# Bootstrap e sessão

## `cht.config.ts`

Lido pelo runner do workspace, não pelo navegador. Exporta um objeto simples:

| Campo | Valor |
| --- | --- |
| `name`, `siteTitle` | `mecarvit`, `Mecarvit`. O `name` é o que vai em `--client:`. |
| `api.dev`, `api.web`, `api.electron`, `api.mobile` | URL da API por alvo. Vêm de `.env`/`.env.example` (`CHT_API_DEV`, `CHT_API_WEB`, `CHT_API_ELECTRON`, `CHT_API_MOBILE`); o padrão é `http://127.0.0.1:3001`, e os outros alvos herdam o de `dev`. |
| `apiPortScanLimit` | `20`: quantas portas seguintes testar se a API não responde na configurada. |
| `frontend.repo`, `backend.repo` | Repositórios usados pelo `install`. |
| `backend` | Pasta `cht-backend-mecarvit`; comando `npm run dev` no watch e `npm run start` no desktop; vai dentro do instalador (`packageWithElectron`). |
| `publish` | Dados do GitHub para atualização do app desktop. |

## `App.vue`

Embrulha tudo em `ElectronStartupGate` (tela de arranque do app desktop, vem do base) e monta `RouterView`, `DevToolsExample` e `Toast` (posição inferior). Ao ser criado, aplica o tema personalizado **`hodiernus`** (`projectActions.setCustomTheme`).

## `bootstrap.ts`

O base chama duas funções deste arquivo:

### `setupAuthGuard(router)`

Registra `router.beforeEach` com as regras das rotas (campos `meta` em [rotas e navegação](./rotas-e-navegacao.md)):

| `meta` | Regra |
| --- | --- |
| `requiresAuth` | Sem usuário na sessão, vai para `login`, guardando a rota de destino em `?redirect=` (exceto quando era a raiz). |
| `guestOnly` | Com usuário logado, vai para `home`. |
| `requiresSuperadmin` | Quem não é superadmin vai para `home`. |

"Usuário logado" é ter `mecarvit.user` preenchido ([sessão](./modulos/sessao.md)).

### `installClientPlugins(app, router)`

Roda uma vez, **antes** de o router entrar em ação, para que a primeira navegação já saiba quem está logado:

1. Instala o plugin `mecarvitPlugin`, que expõe `this.$mecarvit` (estado reativo com `user` e `company`) em todos os componentes.
2. Registra `onHttpUnauthorized`: qualquer 401 da API limpa a sessão e desliga o tempo real.
3. Carrega o usuário (`GET /api/me`) e, se houver, a empresa (`GET /api/empresa`).
4. Liga o tempo real somente se há usuário (`setRealtimeEnabled`).
5. Registra um ouvinte de eventos: **só para o superadmin**, e só para eventos de cadastro, mostra um toast como "Fulano cadastrou um cliente" (o evento vem do backend; ver o [tempo real do backend](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/tempo-real.md)).

## Ciclo da sessão

| Momento | O que acontece |
| --- | --- |
| Abrir o app | `loadCurrentUser` consulta `/api/me`. O cookie `httpOnly` da API é a sessão; o cliente não guarda token. |
| Login ou cadastro | A API grava o cookie; [`completeAuth`](./modulos/sessao.md#completeauth) recarrega usuário e empresa, liga o tempo real e redireciona. |
| Senha inicial | `completeAuth` leva para `/trocar-senha` antes de qualquer outra tela. |
| Sair | [`endSession`](./modulos/sessao.md#endsession) chama `POST /api/logout`, limpa o estado e desliga o tempo real. |
| 401 em qualquer chamada | A sessão é limpa e a próxima navegação cai no login. |
