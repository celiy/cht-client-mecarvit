import { formatTableLabel } from "./formatTableLabel";

export type OsStatusBadge = {
    badge: {
        label: string;
        color: string;
    };
};

export type StatusIndicator = {
    color: string;
};

/** Tailwind palette tokens (e.g. sky-500) — classes must stay literal for the compiler. */
const COLOR_BY_STATUS_ID: Record<number, string> = {
    1: "info",
    2: "warning",
    3: "blue-500",
    4: "success",
    5: "destructive"
};

const DEFAULT_COLOR = "slate-500";

export function osStatusColor(statusOsId: number): string {
    return COLOR_BY_STATUS_ID[statusOsId] ?? DEFAULT_COLOR;
}

function cssColorValue(rawColor: string): string {
    const tokenMap: Record<string, string> = {
        info: "var(--color-info)",
        warning: "var(--color-warning)",
        success: "var(--color-success)",
        destructive: "var(--color-destructive)",
        "blue-500": "var(--color-blue-500)",
        "slate-500": "var(--color-slate-500)",
        "gray-500": "var(--color-gray-500)",
        "red-500": "var(--color-red-500)",
        "green-500": "var(--color-green-500)",
        "amber-500": "var(--color-amber-500)"
    };

    return tokenMap[rawColor] ?? rawColor;
}

export function osStatusIndicator(statusOsId: number): StatusIndicator {
    return {
        color: cssColorValue(osStatusColor(statusOsId))
    };
}

export function osStatusBadge(statusOsId: number, nome: string): OsStatusBadge {
    const color = osStatusColor(statusOsId);

    return {
        badge: {
            label: formatTableLabel(nome),
            color
        }
    };
}
