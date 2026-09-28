<template>
    <main class="container-center container p-8">
        <template v-if="!isGerente">
            <section class="max-w-xl">
                <h2 class="mb-2!">Olá, {{ userName }}</h2>

                <p class="text-muted-foreground!">
                    Bem-vindo ao Mecarvit. Use o menu para acessar as áreas disponíveis ao seu
                    cargo.
                </p>
            </section>
        </template>

        <template v-else>
            <section>
                <h2 class="mb-4!">Dashboard</h2>

                <Tabs variant="transparent">
                    <template #tab-title-0>Entradas e Saídas</template>
                    <template #tab-title-1>Ordens de Serviço</template>

                    <template #tab-content-0>
                        <div class="flex w-full flex-col gap-4 pt-2">
                            <div class="grid gap-4 md:grid-cols-2">
                                <Card
                                    v-for="card in financeCards"
                                    :key="card.key"

                                    :border-style="
                                        card?.cardStyle?.card?.borderStyle
                                            ? card?.cardStyle?.card?.borderStyle
                                            : ''
                                    "
                                    stretch
                                >
                                    <template #body>
                                        <div class="flex gap-4">
                                            <ItemIcon
                                                :icon="card.icon"
                                                :background-style="
                                                    card?.cardStyle?.icon?.backgroundStyle
                                                        ? card?.cardStyle?.icon?.backgroundStyle
                                                        : ''
                                                "
                                                :icon-style="
                                                    card?.cardStyle?.icon?.iconStyle
                                                        ? card?.cardStyle?.icon?.iconStyle
                                                        : ''
                                                "
                                            />

                                            <div class="min-w-0">
                                                <p>
                                                    <b>{{ card.title }}</b>
                                                </p>

                                                <small class="text-muted-foreground!">
                                                    {{ card.description }}
                                                </small>
                                            </div>
                                        </div>

                                        <div
                                            class="mt-auto flex items-end justify-between gap-2 pt-4"
                                        >
                                            <h3 class="mb-0!">
                                                {{ loadingCards ? "…" : money(card.value) }}
                                            </h3>

                                            <div class="relative">
                                                <Button
                                                    class="p-2.5"
                                                    aria-label="Filtros"

                                                    @click.stop="
                                                        cardOpens[card.key] = !cardOpens[card.key]
                                                    "
                                                >
                                                    <span class="fa-solid fa-filter text-xs" />
                                                </Button>

                                                <Dropdown
                                                    v-model:open="cardOpens[card.key]"
                                                    hide-dropdown-arrow
                                                    show-checkmark
                                                    :close-on-select="true"
                                                    :min-width-px="180"
                                                    :options="periodoOptions"
                                                    :is-option-selected="
                                                        (value) => value === card.periodo
                                                    "

                                                    @click:value="onCardPeriodo(card.key, $event)"
                                                />
                                            </div>
                                        </div>
                                    </template>
                                </Card>
                            </div>

                            <div class="grid gap-4 lg:grid-cols-1">
                                <TableCharts
                                    variant="bars"
                                    header="Entradas pagas por mês"
                                    :description="`Valor bruto pago de entradas: ${mesesLabel(fluxoEntradaMeses)}`"
                                    color="green-500"
                                    :data="chartEntradas"
                                    :hide-label="false"
                                >
                                    <template #headerRightSide>
                                        <div class="flex w-full justify-end">
                                            <div class="relative">
                                                <Button
                                                    class="px-3 py-2 text-sm"
                                                    aria-label="Filtro de meses"

                                                    @click.stop="
                                                        fluxoEntradaOpen = !fluxoEntradaOpen
                                                    "
                                                >
                                                    {{
                                                        optionLabel(mesesOptions, fluxoEntradaMeses)
                                                    }}
                                                </Button>

                                                <Dropdown
                                                    v-model:open="fluxoEntradaOpen"
                                                    hide-dropdown-arrow
                                                    show-checkmark
                                                    :close-on-select="true"
                                                    :min-width-px="140"
                                                    :options="mesesOptions"
                                                    :is-option-selected="
                                                        (value) =>
                                                            Number(value) === fluxoEntradaMeses
                                                    "

                                                    @click:value="onFluxoMeses('entrada', $event)"
                                                />
                                            </div>
                                        </div>
                                    </template>
                                </TableCharts>

                                <TableCharts
                                    variant="bars"
                                    header="Saídas pagas por mês"
                                    :description="`Valor bruto pago de saídas: ${mesesLabel(fluxoSaidaMeses)}`"
                                    color="lime-500"
                                    :data="chartSaidas"
                                >
                                    <template #headerRightSide>
                                        <div class="flex w-full justify-end">
                                            <div class="relative">
                                                <Button
                                                    class="px-3 py-2 text-sm"
                                                    aria-label="Filtro de meses"

                                                    @click.stop="fluxoSaidaOpen = !fluxoSaidaOpen"
                                                >
                                                    {{ optionLabel(mesesOptions, fluxoSaidaMeses) }}
                                                </Button>

                                                <Dropdown
                                                    v-model:open="fluxoSaidaOpen"
                                                    hide-dropdown-arrow
                                                    show-checkmark
                                                    :close-on-select="true"
                                                    :min-width-px="140"
                                                    :options="mesesOptions"
                                                    :is-option-selected="
                                                        (value) => Number(value) === fluxoSaidaMeses
                                                    "

                                                    @click:value="onFluxoMeses('saida', $event)"
                                                />
                                            </div>
                                        </div>
                                    </template>
                                </TableCharts>

                                <TableCharts
                                    variant="bars"
                                    header="Comparativo entradas e saídas"
                                    :description="`Saldo mensal pago: ${mesesLabel(fluxoComparativoMeses)}`"
                                    color="green-500"
                                    negative-color="orange-500"
                                    :data="chartComparativo"
                                >
                                    <template #headerRightSide>
                                        <div class="flex w-full justify-end">
                                            <div class="relative">
                                                <Button
                                                    class="px-3 py-2 text-sm"
                                                    aria-label="Filtro de meses"

                                                    @click.stop="
                                                        fluxoComparativoOpen = !fluxoComparativoOpen
                                                    "
                                                >
                                                    {{
                                                        optionLabel(
                                                            mesesOptions,
                                                            fluxoComparativoMeses
                                                        )
                                                    }}
                                                </Button>

                                                <Dropdown
                                                    v-model:open="fluxoComparativoOpen"
                                                    hide-dropdown-arrow
                                                    show-checkmark
                                                    :close-on-select="true"
                                                    :min-width-px="140"
                                                    :options="mesesOptions"
                                                    :is-option-selected="
                                                        (value) =>
                                                            Number(value) === fluxoComparativoMeses
                                                    "

                                                    @click:value="
                                                        onFluxoMeses('comparativo', $event)
                                                    "
                                                />
                                            </div>
                                        </div>
                                    </template>
                                </TableCharts>
                            </div>
                        </div>
                    </template>

                    <template #tab-content-1>
                        <div class="flex w-full flex-col gap-4 pt-2">
                            <TableCharts
                                variant="bars"
                                direction="horizontal"
                                header="Ordens por status"
                                :description="`Criadas ou modificadas: ${periodoLabel(osStatusPeriodo)}`"
                                :data="chartOsStatus"
                            >
                                <template #headerRightSide>
                                    <div class="flex w-full justify-end">
                                        <div class="relative">
                                            <Button
                                                class="px-3 py-2 text-sm"
                                                aria-label="Filtro de período"

                                                @click.stop="osStatusOpen = !osStatusOpen"
                                            >
                                                {{ optionLabel(periodoOptions, osStatusPeriodo) }}
                                            </Button>

                                            <Dropdown
                                                v-model:open="osStatusOpen"
                                                hide-dropdown-arrow
                                                show-checkmark
                                                :close-on-select="true"
                                                :min-width-px="180"
                                                :options="periodoOptions"
                                                :is-option-selected="
                                                    (value) => value === osStatusPeriodo
                                                "

                                                @click:value="onOsStatusPeriodo($event)"
                                            />
                                        </div>
                                    </div>
                                </template>
                            </TableCharts>

                            <TableCharts
                                variant="bars"
                                direction="horizontal"
                                header="Ordens por status de pagamento"
                                :description="`Criadas ou modificadas: ${periodoLabel(osPagamentoPeriodo)}`"
                                :data="chartOsPagamento"
                            >
                                <template #headerRightSide>
                                    <div class="flex w-full justify-end">
                                        <div class="relative">
                                            <Button
                                                class="px-3 py-2 text-sm"
                                                aria-label="Filtro de período"

                                                @click.stop="osPagamentoOpen = !osPagamentoOpen"
                                            >
                                                {{
                                                    optionLabel(periodoOptions, osPagamentoPeriodo)
                                                }}
                                            </Button>

                                            <Dropdown
                                                v-model:open="osPagamentoOpen"
                                                hide-dropdown-arrow
                                                show-checkmark
                                                :close-on-select="true"
                                                :min-width-px="180"
                                                :options="periodoOptions"
                                                :is-option-selected="
                                                    (value) => value === osPagamentoPeriodo
                                                "

                                                @click:value="onOsPagamentoPeriodo($event)"
                                            />
                                        </div>
                                    </div>
                                </template>
                            </TableCharts>
                        </div>
                    </template>
                </Tabs>
            </section>
        </template>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Button from "@design/components/Button.vue";
import Card from "@design/components/Card.vue";
import Dropdown from "@design/components/Dropdown.vue";
import ItemIcon from "@design/components/ItemIcon.vue";
import Tabs from "@design/components/Tabs.vue";
import TableCharts from "@design/components/custom/TableCharts.vue";
import type { ChartSeries } from "@design/components/custom/charts/groupChartItems";
import { formatMoneyBrl, notifyHttpError } from "../js/crudHttp";
import {
    MESES_OPTIONS,
    OS_PAGAMENTO_CHART_COLOR,
    OS_STATUS_CHART_COLOR,
    PERIODO_OPTIONS,
    fluxoToChartSeries,
    groupsToChartSeries,
    optionLabel,
    parseMeses,
    periodoLabel,
    type DashboardMeses,
    type DashboardPeriodo,
    type FluxoPagoItem,
    type GroupCountItem
} from "../js/dashboard";
import { currentIsGerente, mecarvit } from "../js/mecarvit";

type FinanceCardKey =
    | "entradaPago"
    | "saidaPago"
    | "entradaAVencer"
    | "saidaAVencer"
    | "entradaAtrasado"
    | "saidaAtrasado";

type FinanceCardState = {
    key: FinanceCardKey;
    title: string;
    icon: string;
    description: string;
    value: number;
    periodo: DashboardPeriodo;
    cardStyle?: {
        icon?: {
            backgroundStyle?: string;
            iconStyle?: string;
        };
        card?: { borderStyle?: string };
    };
};

type CardsApi = {
    entradaPago: number;
    saidaPago: number;
    entradaAVencer: number;
    saidaAVencer: number;
    entradaAtrasado: number;
    saidaAtrasado: number;
};

const emptyChart = (label: string): ChartSeries => ({
    label,
    displayAs: "currency",
    items: []
});

export default defineComponent({
    name: "MecarvitHomePage",

    components: {
        Button,
        Card,
        Dropdown,
        ItemIcon,
        Tabs,
        TableCharts
    },

    data() {
        return {
            periodoOptions: PERIODO_OPTIONS,
            mesesOptions: MESES_OPTIONS,
            loadingCards: false,
            cardOpens: {
                entradaPago: false,
                saidaPago: false,
                entradaAVencer: false,
                saidaAVencer: false,
                entradaAtrasado: false,
                saidaAtrasado: false
            } as Record<FinanceCardKey, boolean>,
            cardPeriodos: {
                entradaPago: "esta_semana",
                saidaPago: "esta_semana",
                entradaAVencer: "esta_semana",
                saidaAVencer: "esta_semana",
                entradaAtrasado: "esta_semana",
                saidaAtrasado: "esta_semana"
            } as Record<FinanceCardKey, DashboardPeriodo>,
            /** Shared fetch cache keyed by periodo for cards (one request per unique periodo). */
            cardsByPeriodo: {} as Record<string, CardsApi>,
            fluxoEntradaMeses: 6 as DashboardMeses,
            fluxoSaidaMeses: 6 as DashboardMeses,
            fluxoComparativoMeses: 6 as DashboardMeses,
            fluxoEntradaOpen: false,
            fluxoSaidaOpen: false,
            fluxoComparativoOpen: false,
            chartEntradas: emptyChart("Entradas"),
            chartSaidas: emptyChart("Saídas"),
            chartComparativo: emptyChart("Comparativo"),
            osStatusPeriodo: "esta_semana" as DashboardPeriodo,
            osPagamentoPeriodo: "esta_semana" as DashboardPeriodo,
            osStatusOpen: false,
            osPagamentoOpen: false,
            chartOsStatus: emptyChart("Status") as ChartSeries,
            chartOsPagamento: emptyChart("Pagamento") as ChartSeries
        };
    },

    computed: {
        isGerente(): boolean {
            return currentIsGerente();
        },

        userName(): string {
            return mecarvit.user?.nome?.trim() || "colaborador";
        },

        financeCards(): FinanceCardState[] {
            const defs: Array<{
                key: FinanceCardKey;
                title: string;
                icon: string;
                prefix: string;
                cardStyle?: {
                    icon?: {
                        backgroundStyle?: string;
                        iconStyle?: string;
                    };
                    card?: { borderStyle?: string };
                };
            }> = [
                {
                    key: "entradaPago",
                    title: "Valor recebido por Entradas",
                    icon: "fa-dollar",
                    prefix: "Entradas pagas",
                    cardStyle: {
                        icon: { backgroundStyle: "bg-green-500/10", iconStyle: "text-green-500" },
                        card: { borderStyle: "border-green-500/50 border-2" }
                    }
                },
                {
                    key: "saidaPago",
                    title: "Valor pago por Saídas",
                    icon: "fa-dollar",
                    prefix: "Saídas pagas",
                    cardStyle: {
                        icon: { backgroundStyle: "bg-lime-500/10", iconStyle: "text-lime-500" },
                        card: { borderStyle: "border-lime-500/50 border-2" }
                    }
                },
                {
                    key: "entradaAVencer",
                    title: "Entradas a vencer",
                    icon: "fa-clock",
                    prefix: "Entradas a vencer",
                    cardStyle: {
                        icon: { backgroundStyle: "bg-yellow-500/10", iconStyle: "text-yellow-500" },
                        card: { borderStyle: "border-yellow-500/50 border-2" }
                    }
                },
                {
                    key: "saidaAVencer",
                    title: "Saídas a vencer",
                    icon: "fa-clock",
                    prefix: "Saídas a vencer",
                    cardStyle: {
                        icon: { backgroundStyle: "bg-amber-500/10", iconStyle: "text-amber-500" },
                        card: { borderStyle: "border-amber-500/50 border-2" }
                    }
                },
                {
                    key: "entradaAtrasado",
                    title: "Entradas atrasadas",
                    icon: "fa-triangle-exclamation",
                    prefix: "Entradas atrasadas",
                    cardStyle: {
                        icon: { backgroundStyle: "bg-orange-500/10", iconStyle: "text-orange-500" },
                        card: { borderStyle: "border-orange-500/50 border-2" }
                    }
                },
                {
                    key: "saidaAtrasado",
                    title: "Saídas atrasadas",
                    icon: "fa-triangle-exclamation",
                    prefix: "Saídas atrasadas",
                    cardStyle: {
                        icon: { backgroundStyle: "bg-red-500/10", iconStyle: "text-red-500" },
                        card: { borderStyle: "border-red-500/50 border-2" }
                    }
                }
            ];

            return defs.map((def) => {
                const periodo = this.cardPeriodos[def.key];
                const cached = this.cardsByPeriodo[periodo];

                return {
                    key: def.key,
                    title: def.title,
                    icon: def.icon,
                    description: `${def.prefix} ${periodoLabel(periodo)}`,
                    value: cached?.[def.key] ?? 0,
                    cardStyle: def.cardStyle,
                    periodo
                };
            });
        }
    },

    watch: {
        isGerente: {
            immediate: true,
            handler(value: boolean) {
                if (value) {
                    void this.loadDashboard();
                }
            }
        }
    },

    methods: {
        periodoLabel,
        optionLabel,
        money(value: number) {
            return formatMoneyBrl(value);
        },

        mesesLabel(meses: DashboardMeses) {
            return meses === 12 ? "últimos 12 meses" : "últimos 6 meses";
        },

        async loadDashboard() {
            await Promise.all([
                this.ensureCardsPeriodo("esta_semana"),
                this.loadFluxo("entrada", this.fluxoEntradaMeses),
                this.loadFluxo("saida", this.fluxoSaidaMeses),
                this.loadFluxo("comparativo", this.fluxoComparativoMeses),
                this.loadOsStatus(this.osStatusPeriodo),
                this.loadOsPagamento(this.osPagamentoPeriodo)
            ]);
        },

        async ensureCardsPeriodo(periodo: DashboardPeriodo) {
            if (this.cardsByPeriodo[periodo]) {
                return;
            }

            this.loadingCards = true;

            try {
                const response = await this.$http.get<{ data: CardsApi }>(
                    `/api/dashboard/financeiro-cards?periodo=${encodeURIComponent(periodo)}`
                );

                this.cardsByPeriodo = {
                    ...this.cardsByPeriodo,
                    [periodo]: response.data.data
                };
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os cards.");
            } finally {
                this.loadingCards = false;
            }
        },

        async onCardPeriodo(key: FinanceCardKey, value: string) {
            const periodo = value as DashboardPeriodo;

            this.cardPeriodos[key] = periodo;
            this.cardOpens[key] = false;
            await this.ensureCardsPeriodo(periodo);
        },

        async loadFluxo(tipo: "entrada" | "saida" | "comparativo", meses: DashboardMeses) {
            try {
                const response = await this.$http.get<{
                    data: { items: FluxoPagoItem[] };
                }>(`/api/dashboard/fluxo-pago?meses=${meses}&tipo=${encodeURIComponent(tipo)}`);
                const items = response.data.data.items ?? [];
                const chart = fluxoToChartSeries(
                    tipo === "comparativo" ? "Saldo" : tipo === "saida" ? "Saídas" : "Entradas",
                    items
                );

                if (tipo === "entrada") {
                    this.chartEntradas = chart;
                } else if (tipo === "saida") {
                    this.chartSaidas = chart;
                } else {
                    this.chartComparativo = chart;
                }
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar o gráfico.");
            }
        },

        async onFluxoMeses(tipo: "entrada" | "saida" | "comparativo", value: string) {
            const meses = parseMeses(value);

            if (tipo === "entrada") {
                this.fluxoEntradaMeses = meses;
                this.fluxoEntradaOpen = false;
            } else if (tipo === "saida") {
                this.fluxoSaidaMeses = meses;
                this.fluxoSaidaOpen = false;
            } else {
                this.fluxoComparativoMeses = meses;
                this.fluxoComparativoOpen = false;
            }

            await this.loadFluxo(tipo, meses);
        },

        async loadOsStatus(periodo: DashboardPeriodo) {
            try {
                const response = await this.$http.get<{
                    data: { items: GroupCountItem[] };
                }>(`/api/dashboard/os-status?periodo=${encodeURIComponent(periodo)}`);

                this.chartOsStatus = groupsToChartSeries(
                    "Ordens",
                    response.data.data.items ?? [],
                    "sum",
                    OS_STATUS_CHART_COLOR
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar status das OS.");
            }
        },

        async loadOsPagamento(periodo: DashboardPeriodo) {
            try {
                const response = await this.$http.get<{
                    data: { items: GroupCountItem[] };
                }>(`/api/dashboard/os-pagamento?periodo=${encodeURIComponent(periodo)}`);

                this.chartOsPagamento = groupsToChartSeries(
                    "Pagamento",
                    response.data.data.items ?? [],
                    "sum",
                    OS_PAGAMENTO_CHART_COLOR
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar pagamentos das OS.");
            }
        },

        async onOsStatusPeriodo(value: string) {
            this.osStatusPeriodo = value as DashboardPeriodo;
            this.osStatusOpen = false;
            await this.loadOsStatus(this.osStatusPeriodo);
        },

        async onOsPagamentoPeriodo(value: string) {
            this.osPagamentoPeriodo = value as DashboardPeriodo;
            this.osPagamentoOpen = false;
            await this.loadOsPagamento(this.osPagamentoPeriodo);
        }
    }
});
</script>
