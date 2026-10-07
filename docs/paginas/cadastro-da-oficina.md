# Cadastro da oficina

**Arquivo:** `src/pages/register.vue` · **Rota:** `/register` (só para visitantes) · **Componente:** `MecarvitRegisterPage`

Cria uma oficina nova junto com o seu primeiro usuário, o **fundador** (superadmin). É o ponto de partida de quem usa o sistema pela primeira vez.

## Campos

| Campo | Vai para |
| --- | --- |
| Nome da oficina | `empresa.nome` |
| Seu nome | `usuario.nome` |
| CPF | `usuario.cpf` |
| Email | `usuario.email` |
| Senha | `usuario.senha` |
| Confirmar senha | Só no frontend: precisa ser igual à senha ("As senhas não coincidem."). |

## Fluxo

1. Valida com `validateCadastro` (do `cht-shared`) e confere a confirmação de senha.
2. Envia `POST /api/cadastro` com `{ empresa: { nome }, usuario: { cpf, nome, email, senha } }`.
3. Em caso de sucesso o usuário já fica logado: [`completeAuth`](../modulos/sessao.md#completeauth) carrega a sessão e leva para o painel. O fundador não precisa trocar a senha.
4. Erros por campo da API (`empresa.nome`, `usuario.cpf`, `usuario.email`, `usuario.senha`) aparecem no campo correspondente.

Um link leva de volta ao login.
