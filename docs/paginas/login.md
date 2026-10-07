# Login

**Arquivo:** `src/pages/login.vue` · **Rota:** `/login` (só para visitantes) · **Componente:** `MecarvitLoginPage`

Tela de entrada. Mostra o logo e o nome do sistema, o formulário e um link **Cadastre a oficina** para [`/register`](./cadastro-da-oficina.md). O botão de atualização do app desktop (`AppUpdateButton`, do base) aparece nela também.

## Campos

| Campo | Observação |
| --- | --- |
| Email | Aparado antes de enviar. |
| Senha | |
| Oficina | Só aparece quando o e-mail existe em mais de uma oficina. |

## Fluxo

1. Valida com `validateLogin` (do `cht-shared`). Erros aparecem no campo e um aviso geral: "Verifique os campos e tente novamente."
2. Envia `POST /api/login` com `email`, `senha` e, se escolhida, `empresaId`.
3. Em caso de sucesso, chama [`completeAuth`](../modulos/sessao.md#completeauth): carrega usuário e empresa, liga o tempo real e redireciona para `?redirect=` (ou `/home`). Se a senha ainda é a inicial, vai para [`/trocar-senha`](./trocar-senha.md).

### Várias oficinas

Se o servidor responde que o login existe em mais de uma oficina (a lista vem em `error.empresas`), a tela mostra o seletor **Oficina**, avisa por toast e espera o usuário escolher e enviar de novo. Se o usuário já havia mais de uma opção e não escolheu, mostra "Selecione a oficina".

### Erros

Mensagens da API (`Credenciais inválidas`, `Usuário inativo`…) aparecem no aviso do formulário; erros por campo (`fields`) vão para o campo. Qualquer outra falha mostra "Não foi possível entrar. Tente novamente."
