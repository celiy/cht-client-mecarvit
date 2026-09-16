<template>
    <form
        :id="formId"
        class="flex flex-col gap-4"

        @submit.prevent="onSubmit"
    >
        <div class="flex flex-col gap-1">
            <Select
                v-if="!isView"

                id="clienteDocumento"
                header="Cliente"
                :options="clienteOptions"
                :search="clienteSearch"
                :model-value="formValues.clienteDocumento"
                :action-icon="mode === 'view' ? undefined : 'fa-plus'"
                action-side="right"
                action-tooltip="Cadastrar cliente"

                @update:value="onClienteChange"
                @click:action="$emit('click:cliente-action')"
                @search:external="onSearchExternal('clienteDocumento', $event)"
            />

            <Input
                v-else

                id="clienteDocumento"
                type="text"
                label="Cliente"
                variant="display"
                readonly
                copiable
                :value="clienteLabel"
            />

            <p
                v-if="fieldError('clienteDocumento')"

                class="mt-1 rounded border border-destructive/20! bg-destructive/10! p-1 px-1.5 text-sm text-destructive/90!"
            >
                {{ fieldError("clienteDocumento") }}
            </p>
        </div>

        <div class="flex flex-col gap-1">
            <Select
                v-if="!isView"

                id="veiculoId"
                header="Veículo"
                :options="filteredVeiculoOptions"
                :search="veiculoSearch"
                :model-value="formValues.veiculoId"
                :disabled="!hasCliente"
                action-icon="fa-plus"
                action-side="right"
                action-tooltip="Cadastrar veículo"

                @update:value="updateValue('veiculoId', $event)"
                @click:action="$emit('click:veiculo-action')"
                @search:external="onSearchExternal('veiculoId', $event)"
            />

            <Input
                v-else

                id="veiculoId"
                type="text"
                label="Veículo"
                variant="display"
                readonly
                copiable
                :value="veiculoLabel"
            />

            <p
                v-if="fieldError('veiculoId')"

                class="mt-1 rounded border border-destructive/20! bg-destructive/10! p-1 px-1.5 text-sm text-destructive/90!"
            >
                {{ fieldError("veiculoId") }}
            </p>
        </div>

        <div
            v-if="statusOptions.length > 0"

            class="flex flex-col gap-1"
        >
            <Select
                v-if="!isView"

                id="statusOsId"
                header="Status"
                :options="statusOptions"
                :model-value="formValues.statusOsId"

                @update:value="updateValue('statusOsId', $event)"
            />

            <Input
                v-else

                id="statusOsId"
                type="text"
                label="Status"
                variant="display"
                readonly
                :value="statusLabel"
            />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
            <Input
                id="dataInicio"
                type="date"
                label="Data de início"
                :variant="isView ? 'display' : 'secondary'"
                :readonly="isView"
                :value="formValues.dataInicio"
                :error="fieldError('dataInicio')"

                @update:value="updateValue('dataInicio', $event)"
            />

            <Input
                id="dataConclusao"
                type="date"
                label="Data de conclusão"
                :variant="isView ? 'display' : 'secondary'"
                :readonly="isView"
                :value="formValues.dataConclusao"
                :error="fieldError('dataConclusao')"

                @update:value="updateValue('dataConclusao', $event)"
            />
        </div>

        <Input
            id="diagnosticoCliente"
            type="textarea"
            label="Diagnóstico do cliente"
            :variant="isView ? 'display' : 'secondary'"
            :readonly="isView"
            :value="formValues.diagnosticoCliente"
            :error="fieldError('diagnosticoCliente')"

            @update:value="updateValue('diagnosticoCliente', $event)"
        />

        <Input
            id="diagnosticoMecanico"
            type="textarea"
            label="Diagnóstico do mecânico"
            :variant="isView ? 'display' : 'secondary'"
            :readonly="isView"
            :value="formValues.diagnosticoMecanico"
            :error="fieldError('diagnosticoMecanico')"

            @update:value="updateValue('diagnosticoMecanico', $event)"
        />

        <OrdemServicoItensSection
            :mode="mode"
            :items="formValues.itens"
            :servico-suggestions="servicoSuggestions"

            @update:items="onItensChange"
            @search:servico="$emit('search:servico', $event)"
        />

        <Input
            id="obs"
            type="textarea"
            label="Observação"
            :variant="isView ? 'display' : 'secondary'"
            :readonly="isView"
            :value="formValues.obs"
            :error="fieldError('obs')"

            @update:value="updateValue('obs', $event)"
        />
    </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Input from "@design/components/Input.vue";
import Select from "@design/components/Select.vue";
import type { DialogMode } from "../js/crudHttp";
import OrdemServicoItensSection, {
    type OrdemServicoItemFormRow
} from "./OrdemServicoItensSection.vue";

export type SelectOption = {
    label: string;
    value: string;
};

export type VeiculoSelectOption = SelectOption & {
    clienteDocumento: string;
};

export type OrdemServicoFormValues = {
    id?: number;
    clienteDocumento: string;
    veiculoId: string;
    statusOsId: string;
    dataInicio: string;
    dataConclusao: string;
    diagnosticoCliente: string;
    diagnosticoMecanico: string;
    obs: string;
    itens: OrdemServicoItemFormRow[];
};

type ServicoSuggestion = {
    id: number;
    nome: string;
};

export default defineComponent({
    name: "OrdemServicoForm",

    components: {
        Input,
        Select,
        OrdemServicoItensSection
    },

    props: {
        formId: {
            type: String,
            required: true
        },

        mode: {
            type: String as PropType<DialogMode>,
            default: "create"
        },

        values: {
            type: Object as PropType<OrdemServicoFormValues>,
            required: true
        },

        clienteOptions: {
            type: Array as PropType<SelectOption[]>,
            default: () => []
        },

        veiculoOptions: {
            type: Array as PropType<VeiculoSelectOption[]>,
            default: () => []
        },

        statusOptions: {
            type: Array as PropType<SelectOption[]>,
            default: () => []
        },

        servicoSuggestions: {
            type: Array as PropType<ServicoSuggestion[]>,
            default: () => []
        },

        errors: {
            type: Object as PropType<Record<string, string>>,
            default: () => ({})
        }
    },

    emits: [
        "submit",
        "click:cliente-action",
        "click:veiculo-action",
        "search:external",
        "search:servico",
        "change:cliente"
    ],

    data() {
        return {
            formValues: { ...this.values, itens: [...(this.values.itens ?? [])] } as OrdemServicoFormValues,
            localErrors: {} as Record<string, string>
        };
    },

    computed: {
        isView(): boolean {
            return this.mode === "view";
        },

        hasCliente(): boolean {
            return Boolean(String(this.formValues.clienteDocumento ?? "").trim());
        },

        clienteSearch() {
            return {
                external: true,
                field: "nome"
            };
        },

        veiculoSearch() {
            return {
                external: true,
                field: "modelo"
            };
        },

        filteredVeiculoOptions(): VeiculoSelectOption[] {
            const documento = this.formValues.clienteDocumento;

            if (!documento) {
                return [];
            }

            return this.veiculoOptions.filter((option) => option.clienteDocumento === documento);
        },

        clienteLabel(): string {
            const found = this.clienteOptions.find((option) => option.value === this.formValues.clienteDocumento);

            return found?.label || this.formValues.clienteDocumento || "—";
        },

        veiculoLabel(): string {
            const found = this.veiculoOptions.find((option) => option.value === this.formValues.veiculoId);

            return found?.label || this.formValues.veiculoId || "—";
        },

        statusLabel(): string {
            const found = this.statusOptions.find((option) => option.value === this.formValues.statusOsId);

            return found?.label || this.formValues.statusOsId || "—";
        }
    },

    watch: {
        values: {
            deep: true,
            handler(next: OrdemServicoFormValues) {
                this.formValues = {
                    ...next,
                    itens: [...(next.itens ?? [])]
                };
                this.localErrors = {};
            }
        }
    },

    methods: {
        fieldError(id: string): string | undefined {
            return this.localErrors[id] || this.errors[id];
        },

        applyFieldErrors(errors: Record<string, string>) {
            this.localErrors = { ...errors };
        },

        setFieldValue(fieldId: string, value: unknown) {
            this.updateValue(fieldId, value);
        },

        updateValue(fieldId: string, value: unknown) {
            (this.formValues as Record<string, unknown>)[fieldId] = value;

            if (this.localErrors[fieldId]) {
                const next = { ...this.localErrors };
                delete next[fieldId];
                this.localErrors = next;
            }
        },

        onItensChange(items: OrdemServicoItemFormRow[]) {
            this.formValues = {
                ...this.formValues,
                itens: items
            };
        },

        getFieldValue(fieldId: string): unknown {
            return (this.formValues as Record<string, unknown>)[fieldId];
        },

        onSearchExternal(id: string, payload: { field: string; value: string }) {
            this.$emit("search:external", {
                id,
                field: payload.field,
                value: payload.value
            });
        },

        onClienteChange(value: string) {
            this.updateValue("clienteDocumento", value);

            const stillValid = this.filteredVeiculoOptions.some(
                (option) => option.value === this.formValues.veiculoId
            );

            if (!stillValid) {
                this.updateValue("veiculoId", "");
            }

            this.$emit("change:cliente", value);
        },

        onSubmit() {
            const errors: Record<string, string> = {};

            if (!this.formValues.clienteDocumento) {
                errors.clienteDocumento = "Cliente é obrigatório";
            }

            if (!this.formValues.veiculoId) {
                errors.veiculoId = "Veículo é obrigatório";
            }

            if (Object.keys(errors).length > 0) {
                this.localErrors = errors;
                return;
            }

            this.$emit("submit", {
                ...this.formValues,
                itens: [...this.formValues.itens]
            });
        }
    }
});
</script>
