import { HttpError } from "@base/http";
import { toQueryString } from "@shared/frontend/queryString";
import { digitsOnly } from "@shared/validators/mecarvit";

export type ListResponse<T> = {
    data: T[];
    page?: number;
    limit?: number;
    total?: number;
};

export type ItemResponse<T> = {
    data: T;
};

export type DialogMode = "view" | "edit" | "create";

export type ItemViewEditExpose = {
    applyFieldErrors: (errors: Record<string, string>) => void;
    setFieldValue: (fieldId: string, value: unknown) => void;
    getFieldValue: (fieldId: string) => unknown;
};

export type ToastLike = {
    error: (message: string) => void;
};

export const CRUD_ROW_ACTIONS = [
    { label: "Visualizar", value: "inspect", icon: "fa-eye" },
    { label: "Editar", value: "edit", icon: "fa-pen" },
    { separator: true },
    { label: "Excluir", value: "delete", icon: "fa-trash", variant: "destructive" as const }
];

export const CRUD_ROW_ACTIONS_WITH_PAGAMENTO = [
    { label: "Visualizar", value: "inspect", icon: "fa-eye" },
    { label: "Editar", value: "edit", icon: "fa-pen" },
    {
        label: "Pagamentos",
        value: "pagamentos",
        icon: "fa-money-bill",
        tooltip: "Adicione, edite, remova pagamentos"
    },
    { separator: true },
    { label: "Excluir", value: "delete", icon: "fa-trash", variant: "destructive" as const }
];

export function fieldErrorsFromHttp(error: HttpError): Record<string, string> {
    const fields: Record<string, string> = {};

    if (!error.fields) {
        return fields;
    }

    for (const [key, value] of Object.entries(error.fields)) {
        if (typeof value === "string") {
            fields[key] = value;
        }
    }

    return fields;
}

export function notifyHttpError(
    toast: ToastLike,
    error: unknown,
    fallback: string,
    dialog?: ItemViewEditExpose
): void {
    if (error instanceof HttpError) {
        const fields = fieldErrorsFromHttp(error);
        const fieldMessage = Object.values(fields).find((message) => message.trim());

        toast.error(fieldMessage || error.message);
        dialog?.applyFieldErrors(fields);
        return;
    }

    toast.error(fallback);
}

export function listQuery(filters: string, page: number, limit: number): string {
    const paging = toQueryString({
        page,
        limit
    });

    return [filters, paging].filter(Boolean).join("&");
}

export function pageCountFromTotal(total: unknown, limit: unknown, fallbackLimit: number): number {
    const totalNum = Number(total ?? 0);
    const limitNum = Number(limit ?? fallbackLimit);

    return limitNum > 0 ? Math.ceil(totalNum / limitNum) : 0;
}

export function isCadastrarQuery(value: unknown): boolean {
    return value === true || value === "true" || value === "1";
}

export function formatMoneyBrl(value: unknown): string {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
        return "—";
    }

    return amount.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

export function documentDigits(value: unknown): string {
    return digitsOnly(String(value ?? ""));
}

/**
 * Keeps the currently selected item in a search result list when it is missing.
 */
export function withSelectedItem<T>(
    items: T[],
    selected: T | undefined,
    keyOf: (item: T) => string
): T[] {
    if (!selected) {
        return items;
    }

    const selectedKey = keyOf(selected);

    if (items.some((item) => keyOf(item) === selectedKey)) {
        return items;
    }

    return [selected, ...items];
}

export const ATIVO_FILTER_OPTIONS = [
    { label: "Ativo", value: "ativo", default: true },
    { label: "Inativo", value: "inativo" }
];
