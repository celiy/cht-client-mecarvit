# Sessão (`mecarvit.ts` e `auth.ts`)

**Arquivos:** `src/js/mecarvit.ts` e `src/js/auth.ts`

## Estado: `mecarvit`

`mecarvit.ts` exporta um objeto reativo com o estado da sessão:

```ts
mecarvit = { user: MecarvitUser | null, company: MecarvitCompany | null }
```

- **`user`**: `cpf`, `nome`, `email`, `ativo`, `senhaInicial`, `fundador`, `cargoId`, `empresaId`, `nivelAcesso`, `cargoNome`, `criadoEm`, `modificadoEm`.
- **`company`**: `id`, `nome`, `criadoEm`, `modificadoEm`.

O plugin `mecarvitPlugin` o expõe em todos os componentes como `this.$mecarvit`.

## Carregar e limpar

| Função | O que faz |
| --- | --- |
| `loadCurrentUser()` | `GET /api/me`. Se a resposta tem o formato esperado, grava o usuário; qualquer falha deixa a sessão vazia. |
| `loadCurrentCompany()` | `GET /api/empresa`, idem para a empresa. |
| `setCurrentUser`, `setCurrentCompany` | Gravam diretamente. |
| `clearMecarvitSession()` | Zera usuário e empresa. |

## Consultas de permissão

`currentHasPermission`, `currentCanCreate`, `currentCanExport`, `currentCanDelete`, `currentCanSeePii`, `currentIsSuperadmin`, `currentIsGerente`, `currentCanManageProfile`, `currentCanManageCargos`, `isUsuarioSuperadmin`, `currentNivelAcesso` e `currentUsuarioCpfDigits`. Estão descritas em [permissões](../permissoes.md).

Filtros de listas: `excludeSuperadminCargos` e `excludeCurrentUsuario`.

## Fluxo de entrada e saída: `auth.ts`

### `completeAuth`

`completeAuth(router, route, payload)` roda depois de um login ou cadastro bem-sucedido:

1. Recarrega usuário e empresa (a API já gravou o cookie).
2. Liga o tempo real se há usuário.
3. Se `payload.precisaTrocarSenha`, vai para `change-password`.
4. Senão, vai para `?redirect=` (a rota que o usuário queria) ou `/home`.

### `endSession`

`endSession()` chama `POST /api/logout` (ignora falhas), zera a sessão e desliga o tempo real.

### Tipos

`AuthApiResponse` descreve a resposta de login e cadastro (`token?`, `usuario`, `empresa`, `precisaTrocarSenha`) e `EmpresaLocal` (`id`, `nome`) a lista de oficinas oferecida quando um e-mail existe em várias.
