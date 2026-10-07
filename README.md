# cht-client-mecarvit

Frontend específico do cliente Mecarvit.

## O que é

O `cht-client-mecarvit` contém a camada de telas e componentes próprios do cliente, acoplada ao `cht-base`.
É um sistema de gestão para oficinas mecânicas: cadastros, ordens de serviço, financeiro e painel de gestão.

## O que faz

- Implementa páginas de negócio do cliente Mecarvit.
- Mantém componentes e lógica local do cliente.
- É carregado pelo `cht-base` conforme a configuração do cliente ativo.
- Reutiliza design system e código compartilhado do workspace.

## Repositórios do ecossistema

| Repositório | Papel |
| --- | --- |
| [cht-main](https://github.com/celiy/cht-main) | Orquestração do workspace: `install`, runner, build e Electron. |
| [cht-base](https://github.com/celiy/cht-base) | Shell Vue/Vite que carrega este cliente (alias `@client`). |
| [cht-design-system](https://github.com/celiy/cht-design-system) | Componentes de UI usados nas telas (alias `@design`). |
| [cht-shared](https://github.com/celiy/cht-shared) | Validadores, formatação e regras de domínio (alias `@shared`). |
| [cht-backend-mecarvit](https://github.com/celiy/cht-backend-mecarvit) | API que este cliente consome. |

## Documentação

A pasta [`docs/`](./docs/README.md) documenta, em português, tudo o que existe neste repositório: **uma página por tela**, **uma por componente**, os módulos de apoio, as rotas, as permissões e o ciclo da sessão.

Comece pela [visão geral](./docs/visao-geral.md); o índice completo está em [`docs/README.md`](./docs/README.md).

## Executar

No workspace `cht-main`:

```bash
npx chtmain dev --client:mecarvit
npx chtmain build mecarvit
```

O backend sobe junto. A URL da API pode ser definida em um `.env` na raiz deste repositório (`CHT_API_DEV`, `CHT_API_WEB`, `CHT_API_ELECTRON`, `CHT_API_MOBILE`); sem ele, usa `http://127.0.0.1:3001`.
