import {
    formatCpfDisplay,
    formatDocumentoDisplay,
    maskCpfDisplay,
    maskDocumentoDisplay
} from "@shared/format/displayMasks";

export const SENSITIVE_CELL_BUTTON_PROPS = {
    variant: "transparent",
    size: "small",
    class: "p-1.5!"
} as const;

export function cpfToggleCell(raw: string): {
    value: string;
    altValue: string;
    buttonProps: typeof SENSITIVE_CELL_BUTTON_PROPS;
} {
    return {
        value: maskCpfDisplay(raw),
        altValue: formatCpfDisplay(raw),
        buttonProps: SENSITIVE_CELL_BUTTON_PROPS
    };
}

export function documentoToggleCell(raw: string): {
    value: string;
    altValue: string;
    buttonProps: typeof SENSITIVE_CELL_BUTTON_PROPS;
} {
    return {
        value: maskDocumentoDisplay(raw),
        altValue: formatDocumentoDisplay(raw),
        buttonProps: SENSITIVE_CELL_BUTTON_PROPS
    };
}

export function unwrapToggleCell(value: unknown): string {
    if (typeof value === "object" && value !== null && "altValue" in value) {
        return String((value as { altValue: unknown }).altValue ?? "");
    }

    return String(value ?? "");
}
