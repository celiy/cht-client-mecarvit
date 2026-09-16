import type { FormField } from "@shared/interfaces/FormField";
import { isCnpjDocument } from "@shared/validators/documents";

type SelectOption = {
    label: string;
    value: string;
};

const plusAction = {
    icon: "fa-plus",
    side: "right" as const
};

export function enderecoFormFields(): FormField[] {
    return [
        { id: "cep", label: "CEP", type: "cep", required: true },
        { id: "estado", label: "Estado", type: "text", required: true },
        { id: "cidade", label: "Cidade", type: "text", required: true },
        { id: "bairro", label: "Bairro", type: "text", required: true },
        { id: "rua", label: "Rua", type: "text", required: true },
        { id: "numero", label: "Número", type: "number", required: true },
        { id: "complemento", label: "Complemento", type: "text" }
    ];
}

export function clienteFormFields(options: {
    isCreate: boolean;
    isView: boolean;
    veiculoOptions: SelectOption[];
    enderecoOptions?: SelectOption[];
    includeVehicles: boolean;
}): FormField[] {
    const fields: FormField[] = [
        {
            id: "documento",
            label: "Documento",
            type: "text",
            required: true,
            readonly: !options.isCreate,
            helperText: options.isCreate ? "CPF ou CNPJ" : undefined
        },
        {
            id: "nome",
            label: "Nome",
            type: "text",
            required: true
        },
        {
            id: "nomeSocial",
            label: "Nome social",
            type: "text",
            condition: {
                field: "documento",
                operator: "cnpj"
            }
        },
        {
            id: "email",
            label: "Email",
            type: "email"
        },
        {
            id: "cel",
            label: "Celular",
            type: "phone"
        },
        {
            id: "obs",
            label: "Observação",
            type: "textarea"
        }
    ];

    fields.push({
        id: "enderecoIds",
        label: "Endereços",
        type: "select",
        options: options.enderecoOptions ?? [],
        selectMultiple: { min: 0 },
        selectSeparateSelected: true,
        selectSearch: {
            external: true,
            field: "rua"
        },
        selectAction: options.isView
            ? undefined
            : {
                ...plusAction,
                tooltip: "Cadastrar endereço"
            }
    });

    if (options.includeVehicles) {
        fields.push({
            id: "veiculoIds",
            label: "Veículos",
            type: "select",
            options: options.veiculoOptions,
            selectMultiple: { min: 0 },
            selectSeparateSelected: true,
            selectAction: options.isView
                ? undefined
                : {
                    ...plusAction,
                    tooltip: "Cadastrar veículo"
                }
        });
    }

    if (!options.isCreate) {
        fields.push({
            id: "ativo",
            label: "Ativo",
            type: "checkbox",
            checkboxStyle: "switch"
        });
    }

    return fields;
}

/** Omit when not a CNPJ; trimmed name otherwise; empty update clears with null. */
export function clienteNomeSocialForSave(
    documento: unknown,
    nomeSocial: unknown,
    isCreate: boolean
): string | null | undefined {
    if (!isCnpjDocument(documento)) {
        return undefined;
    }

    const text = String(nomeSocial ?? "").trim();

    if (text) {
        return text;
    }

    return isCreate ? undefined : null;
}

export function veiculoFormFields(options: {
    isCreate: boolean;
    clienteOptions: SelectOption[];
    showCliente: boolean;
}): FormField[] {
    const fields: FormField[] = [];

    if (options.showCliente) {
        fields.push({
            id: "clienteDocumento",
            label: "Cliente",
            type: "select",
            required: true,
            options: options.clienteOptions,
            selectSearch: {
                external: true,
                field: "nome"
            }
        });
    }

    fields.push(
        {
            id: "modelo",
            label: "Modelo",
            type: "text",
            required: true
        },
        {
            id: "placa",
            label: "Placa",
            type: "text",
            required: true
        },
        {
            id: "tipo",
            label: "Tipo",
            type: "text"
        },
        {
            id: "chassi",
            label: "Chassi",
            type: "text"
        },
        {
            id: "kilometragem",
            label: "Quilometragem",
            type: "number"
        },
        {
            id: "dataTrocaOleo",
            label: "Data da troca de óleo",
            type: "date"
        }
    );

    if (!options.isCreate) {
        fields.push({
            id: "ativo",
            label: "Ativo",
            type: "checkbox",
            checkboxStyle: "switch"
        });
    }

    return fields;
}

export type VeiculoFormExtras = {
    chassi: string;
    kilometragem: string;
    dataTrocaOleo: string;
};

export function emptyVeiculoFormExtras(): VeiculoFormExtras {
    return {
        chassi: "",
        kilometragem: "",
        dataTrocaOleo: ""
    };
}

/**
 * Formats an API date as `YYYY-MM-DD` for `input type="date"`.
 */
export function dateToInputValue(value: unknown): string {
    if (value == null || value === "") {
        return "";
    }

    if (typeof value === "number" && Number.isFinite(value)) {
        const ms = value < 1e12 ? value * 1000 : value;
        const date = new Date(ms);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toISOString().slice(0, 10);
    }

    if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
            return "";
        }

        return value.toISOString().slice(0, 10);
    }

    if (typeof value === "string") {
        const trimmed = value.trim();

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        const date = new Date(trimmed);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return date.toISOString().slice(0, 10);
    }

    return "";
}

export function veiculoExtrasFromApi(veiculo: {
    chassi?: string | null;
    kilometragem?: number | null;
    dataTrocaOleo?: string | Date | number | null;
}): VeiculoFormExtras {
    return {
        chassi: veiculo.chassi ?? "",
        kilometragem: veiculo.kilometragem == null ? "" : String(veiculo.kilometragem),
        dataTrocaOleo: dateToInputValue(veiculo.dataTrocaOleo)
    };
}

export function veiculoOptionalFields(
    payload: {
        chassi?: unknown;
        kilometragem?: unknown;
        dataTrocaOleo?: unknown;
    },
    options: { clearEmpty: boolean }
): {
    chassi?: string | null;
    kilometragem?: number | null;
    dataTrocaOleo?: string | null;
} {
    const result: {
        chassi?: string | null;
        kilometragem?: number | null;
        dataTrocaOleo?: string | null;
    } = {};

    const chassi = String(payload.chassi ?? "").trim();
    const data = String(payload.dataTrocaOleo ?? "").trim();
    const kmRaw = payload.kilometragem;
    const kmEmpty = kmRaw === undefined || kmRaw === null || String(kmRaw).trim() === "";

    if (chassi) {
        result.chassi = chassi;
    } else if (options.clearEmpty) {
        result.chassi = null;
    }

    if (!kmEmpty) {
        const km = Number(kmRaw);

        if (Number.isFinite(km)) {
            result.kilometragem = km;
        }
    } else if (options.clearEmpty) {
        result.kilometragem = null;
    }

    if (data) {
        result.dataTrocaOleo = data;
    } else if (options.clearEmpty) {
        result.dataTrocaOleo = null;
    }

    return result;
}

export function registroFormFields(options?: {
    lockValorFromOs?: boolean;
    lockTipoFromOs?: boolean;
    showValorPago?: boolean;
}): FormField[] {
    const lockValor = Boolean(options?.lockValorFromOs);
    const lockTipo = Boolean(options?.lockTipoFromOs);
    const showValorPago = Boolean(options?.showValorPago);

    const fields: FormField[] = [
        {
            id: "tipo",
            label: "Tipo",
            type: "select",
            required: true,
            readonly: lockTipo,
            disabled: lockTipo,
            options: [
                { label: "Entrada", value: "entrada" },
                { label: "Saída", value: "saida" }
            ]
        },
        {
            id: "nome",
            label: "Nome",
            type: "text",
            required: true
        },
        {
            id: "valor",
            label: "Valor",
            type: "money",
            required: !lockValor,
            readonly: lockValor,
            disabled: lockValor
        }
    ];

    if (showValorPago) {
        fields.push({
            id: "valorPago",
            label: "Valor pago",
            type: "text",
            readonly: true,
            disabled: true
        });
    }

    fields.push({
        id: "descricao",
        label: "Descrição",
        type: "textarea"
    });

    return fields;
}
