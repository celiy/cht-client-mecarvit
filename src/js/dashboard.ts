import type { ChartSeries } from "@design/components/custom/charts/groupChartItems";
import type { OptionItem } from "@design/components/internal/OptionsList.vue";
import { PAGAMENTO_SITUACAO } from "@shared/mecarvit/pagamentoSituacao";
import { formatTableLabel } from "./formatTableLabel";

export type DashboardPeriodo = "esta_semana" | "este_mes" | "6_meses" | "em_geral";
export type DashboardMeses = 6 | 12;

export const PERIODO_OPTIONS: OptionItem[] = [
    { label: "Esta semana", value: "esta_semana" },
    { label: "Este mês", value: "este_mes" },
    { label: "6 meses", value: "6_meses" },
    { label: "Em geral", value: "em_geral" }
];

export const MESES_OPTIONS: OptionItem[] = [
    { label: "6 meses", value: "6" },
    { label: "12 meses", value: "12" }
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
    cancelada: "destructive"
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
    return Number(value) === 12 ? 12 : 6;
}

export type FluxoPagoItem = {
    date: string;
    value: number;
};

export type GroupCountItem = {
    group: string;
    value: number;
};

export function fluxoToChartSeries(
    label: string,
    items: FluxoPagoItem[],
    displayAs: "currency" | "sum" = "currency"
): ChartSeries {
    return {
        label,
        displayAs,
        items: items.map((item) => ({
            value: item.value,
            date: new Date(item.date)
        }))
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
            color: colorForGroup(item.group, colorByGroup)
        }))
    };
}
