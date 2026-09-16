import { formatTableLabel } from "./formatTableLabel";

export type OsStatusBadge = {
    badge: {
        label: string;
        color: string;
    };
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

export function osStatusBadge(statusOsId: number, nome: string): OsStatusBadge {
    const color = COLOR_BY_STATUS_ID[statusOsId] ?? DEFAULT_COLOR;

    return {
        badge: {
            label: formatTableLabel(nome),
            color
        }
    };
}
