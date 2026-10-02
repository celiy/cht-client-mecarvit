import type { ChartSeries } from "@design/components/custom/charts/groupChartItems";
import type { OptionItem } from "@design/components/internal/OptionsList.vue";
import { PAGAMENTO_SITUACAO } from "@shared/mecarvit/pagamentoSituacao";
import { formatTableLabel } from "./formatTableLabel";

export type DashboardPeriodo = "esta_semana" | "este_mes" | "6_meses" | "em_geral";
export type DashboardMeses = 6 | 12 | 72;
export type FluxoModo = "diferenca" | "conjunto";

export const PERIODO_OPTIONS: OptionItem[] = [
    { label: "Esta semana", value: "esta_semana" },
    { label: "Este mês", value: "este_mes" },
    { label: "6 meses", value: "6_meses" },
    { label: "Em geral", value: "em_geral" }
];

export const MESES_OPTIONS: OptionItem[] = [
    { label: "6 meses", value: "6" },
    { label: "12 meses", value: "12" },
    { label: "6 anos", value: "72" }
];

export const FLUXO_MODO_OPTIONS: Array<{ label: string; value: FluxoModo }> = [
    { label: "Diferença", value: "diferenca" },
    { label: "Conjunto", value: "conjunto" }
];

export const PERIODO_LABEL: Record<DashboardPeriodo, string> = {
    esta_semana: "esta semana",
    este_mes: "este mês",
    "6_meses": "os últimos 6 meses",
    em_geral: "todo o período"
};

/** Matches OS status badge colors in tables (by raw DB nome, lowercase). */
export const OS_STATUS_CHART_COLOR: Record<string, string> = {
    aberta: "info",
    pendente: "warning",
    "em andamento": "blue-500",
    concluída: "success",
    cancelada: "destructive",
    reaberta: "violet-500"
};

/** Matches pagamento badge colors in tables. */
export const OS_PAGAMENTO_CHART_COLOR: Record<string, string> = {
    [PAGAMENTO_SITUACAO.NAO_PAGO]: "orange-600",
    [PAGAMENTO_SITUACAO.A_VENCER]: "warning",
    [PAGAMENTO_SITUACAO.ATRASADO]: "destructive",
    [PAGAMENTO_SITUACAO.PAGO]: "success"
};

export function periodoLabel(periodo: DashboardPeriodo): string {
    return PERIODO_LABEL[periodo] ?? periodo;
}

export function optionLabel(options: OptionItem[], value: string | number): string {
    const key = String(value);
    const found = options.find((option) => option.value === key);

    return found?.label ?? key;
}

export function parseMeses(value: string | number): DashboardMeses {
    const n = Number(value);

    if (n === 12) {
        return 12;
    }

    if (n === 72) {
        return 72;
    }

    return 6;
}

export type FluxoPagoItem = {
    date: string;
    value: number;
    entrada?: number;
    saida?: number;
};

export type GroupCountItem = {
    group: string;
    value: number;
    id?: string;
};

export function fluxoToChartSeries(
    label: string,
    items: FluxoPagoItem[],
    displayAs: "currency" | "sum" = "currency",
    modo: FluxoModo = "diferenca",
    yearly = false
): ChartSeries {
    return {
        label,
        displayAs,
        items: items.map((item) => {
            const year = new Date(item.date).getFullYear();
            const place = yearly
                ? { group: String(year) }
                : { date: new Date(item.date) };

            if (modo === "conjunto") {
                return {
                    ...place,
                    value: item.entrada ?? Math.max(0, item.value),
                    valueNegative: item.saida ?? 0
                };
            }

            return {
                ...place,
                value: item.value
            };
        })
    };
}

function colorForGroup(group: string, colorByGroup?: Record<string, string>): string | undefined {
    if (!colorByGroup) {
        return undefined;
    }

    return colorByGroup[group] ?? colorByGroup[group.toLowerCase()];
}

export function groupsToChartSeries(
    label: string,
    items: GroupCountItem[],
    displayAs: "currency" | "sum" = "sum",
    colorByGroup?: Record<string, string>
): ChartSeries {
    return {
        label,
        displayAs,
        items: items.map((item) => ({
            value: item.value,
            group: formatTableLabel(item.group),
            color: colorForGroup(item.group, colorByGroup),
            id: item.id
        }))
    };
}
