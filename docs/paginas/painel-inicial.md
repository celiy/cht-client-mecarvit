# Painel inicial

**Arquivo:** `src/pages/home.vue` · **Rota:** `/home` (destino da raiz `/`) · **Componente:** `MecarvitHomePage`

O que aparece depende do cargo.

## Para quem não é gerente

Uma saudação, "Olá, {nome}", e o texto "Bem-vindo ao Mecarvit. Use o menu para acessar as áreas disponíveis ao seu cargo."

## Para gerentes e superadmin: Dashboard

Duas abas. Os dados vêm das rotas de [`/api/dashboard`](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/entidades/dashboard.md) e são carregados ao abrir a página. Cada gráfico tem seu próprio filtro de período ou de meses. Os rótulos, opções e conversões estão em [`dashboard.ts`](../modulos/painel.md).

### Aba "Entradas e Saídas"

- **Seis cartões**, cada um com seu período próprio (`esta semana`, `este mês`, `6 meses`, `em geral`): valor recebido por entradas, valor pago por saídas, entradas e saídas a vencer, entradas e saídas atrasadas.
- **Entradas pagas por mês**: gráfico de barras, com filtro de 6 meses, 12 meses ou 6 anos.
- **Saídas pagas por mês**: o mesmo, para saídas.
- **Saldo mensal pago**: o comparativo, com um seletor entre **Diferença** (entrada menos saída) e **Conjunto** (as duas barras).

### Aba "Ordens de Serviço"

- **Ordens por status**: barras horizontais, nas mesmas cores dos selos da tabela.
- **Ordens de serviço reabertas**: barras clicáveis. Clicar em uma barra abre um modal com a lista das OS reabertas naquele dia ou mês (cliente, veículo, responsáveis), com paginação. A ação **Ver** de cada linha abre a OS em `/ordem-servico?os={id}`, já em modo de visualização.
- **Ordens por status de pagamento**: barras horizontais por situação (Não pago, A vencer, Atrasado, Pago).

Os gráficos usam o componente `TableCharts` do design system.
