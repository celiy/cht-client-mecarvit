# Apoio ao painel (`dashboard.ts`)

**Arquivo:** `src/js/dashboard.ts`

Tipos, opções de filtro e conversões dos dados do [painel inicial](../paginas/painel-inicial.md). Os dados vêm de [`/api/dashboard`](https://github.com/celiy/cht-backend-mecarvit/blob/main/docs/entidades/dashboard.md).

## Opções e rótulos

| Item | Valores |
| --- | --- |
| `DashboardPeriodo` e `PERIODO_OPTIONS` | `esta_semana` ("Esta semana"), `este_mes` ("Este mês"), `6_meses` ("6 meses"), `em_geral` ("Em geral"). |
| `DashboardMeses` e `MESES_OPTIONS` | `6`, `12` e `72` ("6 meses", "12 meses", "6 anos"). |
| `FluxoModo` e `FLUXO_MODO_OPTIONS` | `diferenca` ("Diferença") e `conjunto` ("Conjunto"). |
| `periodoLabel(periodo)` | Frase para usar em descrições ("esta semana", "os últimos 6 meses"…). |
| `optionLabel(opções, valor)`, `parseMeses(valor)` | Rótulo de uma opção e conversão para um dos valores de meses (padrão 6). |

## Cores

- `OS_STATUS_CHART_COLOR`: a cor de cada status de OS no gráfico, igual à dos selos da tabela (aberta `info`, pendente `warning`, em andamento `blue-500`, concluída `success`, cancelada `destructive`, reaberta `violet-500`).
- `OS_PAGAMENTO_CHART_COLOR`: a cor de cada situação de pagamento (Não pago `orange-600`, A vencer `warning`, Atrasado `destructive`, Pago `success`).

## Conversão para gráficos

| Função | Resultado |
| --- | --- |
| `fluxoToChartSeries(rótulo, itens, exibir, modo, anual)` | Série de barras ou onda a partir do fluxo pago. No modo `conjunto`, cada ponto leva a entrada como valor positivo e a saída como valor negativo; no modo `diferenca`, só o saldo. Em `anual` (6 anos) agrupa por ano em vez de data. |
| `groupsToChartSeries(rótulo, itens, exibir, cores?)` | Série agrupada (status, situação de pagamento, reaberturas), com o nome de cada grupo formatado e a cor do mapa, quando há. |

As séries são do tipo `ChartSeries` do design system, que o componente `TableCharts` desenha.
