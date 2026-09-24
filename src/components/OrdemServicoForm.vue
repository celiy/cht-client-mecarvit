<template>
    <form
        :id="formId"
        class="flex flex-col gap-4"

        @submit.prevent="onSubmit"
    >
        <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
                <Select
                    v-if="!isCoreReadonly"

                    id="clienteDocumento"
                    combobox
                    combobox-option
                    header="Cliente *"
                    :options="clienteOptions"
                    :search="clienteSearch"
                    :model-value="formValues.clienteDocumento"
                    :query="formValues.clienteNome"
                    :error="fieldError('clienteDocumento') || fieldError('clienteNome')"

                    @update:value="onClienteSelect"
                    @update:query="onClienteQuery"
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
            </div>

            <Input
                v-if="showClienteCpfField"

                id="clienteCpfNovo"
                type="cpf"
                label="CPF do cliente"
                required
                variant="secondary"
                :value="formValues.clienteCpfNovo"
                :error="fieldError('clienteCpfNovo')"

                @update:value="updateValue('clienteCpfNovo', $event)"
            />

            <Input
                v-if="showClienteCelField"

                id="clienteCel"
                type="phone"
                label="Celular do cliente"
                :variant="isView ? 'display' : 'secondary'"
                :readonly="isView"
                :value="formValues.clienteCel"
                :error="fieldError('clienteCel')"

                @update:value="updateValue('clienteCel', $event)"
            />
        </div>

        <Select
            v-if="!isCoreReadonly && !isOrcamentoMode && !restrictedEdit"

            id="responsaveisCpfs"
            label="Funcionário(s) responsáve(l/is)"
            placeholder="Selecione um ou mais funcionários"
            :options="funcionarioSelectOptionsResolved"
            :search="funcionarioSearch"
            :model-value="formValues.responsaveisCpfs"
            :select-multiple="{ min: 0 }"
            :error="fieldError('responsaveisCpfs')"

            @update:value="onResponsaveisChange"
            @search:external="onSearchExternal('responsaveisCpfs', $event)"
        />

        <div
            v-else-if="isView && !restrictedEdit && responsaveisViewItems.length > 0"

            class="flex flex-col gap-1.5"
        >
            <span class="text-sm font-bold text-foreground"> Funcionário(s) responsáve(l/is) </span>

            <ul
                v-if="responsaveisViewItems.length > 0"

                class="list-disc space-y-1 pl-5 text-sm text-foreground"
            >
                <li
                    v-for="item in responsaveisViewItems"
                    :key="item.value"
                >
                    <small>{{ item.label }}</small>
                </li>
            </ul>

            <span
                v-else

                class="text-sm text-muted-foreground"
            >
                —
            </span>
        </div>

        <Marker separator />

        <div class="grid gap-4 sm:grid-cols-2">
            <div class="flex flex-col gap-1">
                <Select
                    v-if="!isCoreReadonly"

                    id="veiculoId"
                    combobox
                    combobox-option
                    header="Modelo *"
                    :options="veiculoModeloOptions"
                    :search="veiculoSearch"
                    :model-value="formValues.veiculoId"
                    :query="formValues.veiculoModelo"
                    :disabled="!canEditVeiculoFields"
                    :error="fieldError('veiculoId') || fieldError('veiculoModelo')"

                    @update:value="onVeiculoSelect"
                    @update:query="onVeiculoModeloQuery"
                    @search:external="onSearchExternal('veiculoId', $event)"
                />

                <Input
                    v-else

                    id="veiculoModelo"
                    type="text"
                    label="Modelo"
                    variant="display"
                    readonly
                    :value="formValues.veiculoModelo || veiculoLabel"
                />
            </div>

            <Input
                id="veiculoPlaca"
                type="text"
                label="Placa"
                required
                :variant="isCoreReadonly ? 'display' : 'secondary'"
                :readonly="isCoreReadonly"
                :disabled="!canEditVeiculoFields && !isCoreReadonly"
                :value="formValues.veiculoPlaca"
                :error="fieldError('veiculoPlaca')"

                @update:value="updateValue('veiculoPlaca', $event)"
            />
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
            <Input
                id="veiculoKilometragem"
                type="number"
                label="Quilometragem"
                :variant="isCoreReadonly ? 'display' : 'secondary'"
                :readonly="isCoreReadonly"
                :disabled="!canEditVeiculoFields && !isCoreReadonly"
                :value="formValues.veiculoKilometragem"
                :error="fieldError('veiculoKilometragem')"

                @update:value="updateValue('veiculoKilometragem', $event)"
            />

            <Select
                v-if="!isCoreReadonly"

                id="veiculoTipo"
                combobox
                combobox-option
                header="Tipo"
                :options="veiculoTipoOptions"
                :model-value="formValues.veiculoTipo"
                :query="veiculoTipoQuery"
                :disabled="!canEditVeiculoFields"
                :error="fieldError('veiculoTipo')"

                @update:value="onVeiculoTipoSelect"
                @update:query="onVeiculoTipoQuery"
            />

            <Input
                v-else

                id="veiculoTipo"
                type="text"
                label="Tipo"
                variant="display"
                readonly
                :value="veiculoTipoLabel"
            />
        </div>

        <Marker separator />

        <div
            v-if="showStatusBlock"

            class="flex flex-col gap-1"
        >
            <Select
                v-if="!isCoreReadonly && showStatusField"

                id="statusOsId"
                label="Status"
                placeholder="Selecione o status"
                header="Selecione o status"
                :options="statusOptions"
                :model-value="formValues.statusOsId"

                @update:value="updateValue('statusOsId', $event)"
            />

            <Input
                v-else-if="showStatusField"

                id="statusOsId"
                type="text"
                label="Status"
                variant="display"
                readonly
                :value="statusLabel"
            />

            <div
                v-if="!isOrcamentoMode && !restrictedEdit"

                class="mt-3 grid gap-4 sm:grid-cols-2"
            >
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

                <Input
                    id="dataLimitePagamento"
                    type="date"
                    label="Data limite de pagamento"
                    helper-text="Opcional. Prazo combinado com o cliente para o pagamento."
                    :variant="isView ? 'display' : 'secondary'"
                    :readonly="isView"
                    :value="formValues.dataLimitePagamento"
                    :error="fieldError('dataLimitePagamento')"

                    @update:value="updateValue('dataLimitePagamento', $event)"
                />
            </div>
        </div>

        <Marker separator />

        <Input
            id="diagnosticoCliente"
            type="textarea"
            label="Diagnóstico do cliente"
            :variant="isCoreReadonly ? 'display' : 'secondary'"
            :readonly="isCoreReadonly"
            :value="formValues.diagnosticoCliente"
            :error="fieldError('diagnosticoCliente')"

            @update:value="updateValue('diagnosticoCliente', $event)"
        />

        <Input
            v-if="!isOrcamentoMode"

            id="diagnosticoMecanico"
            type="textarea"
            label="Diagnóstico do mecânico"
            :variant="isView ? 'display' : 'secondary'"
            :readonly="isView"
            :value="formValues.diagnosticoMecanico"
            :error="fieldError('diagnosticoMecanico')"

            @update:value="updateValue('diagnosticoMecanico', $event)"
        />

        <Marker separator />

        <OrdemServicoItensSection
            :mode="itensMode"
            :items="formValues.itens"
            :servico-suggestions="servicoSuggestions"

            @update:items="onItensChange"
            @search:servico="$emit('search:servico', $event)"
        />

        <div class="rounded border border-dashed p-3">
            <div
                class="grid gap-4"
                :class="isOrcamentoMode || !canSeePagamentos ? 'sm:grid-cols-1' : 'sm:grid-cols-2'"
            >
                <Input
                    id="totalGeral"
                    type="money"
                    label="Total geral"
                    variant="display"
                    readonly
                    :value="totalsDisplay.total"
                />

                <div
                    v-if="!isOrcamentoMode && canSeePagamentos"

                    class="flex flex-col gap-4"
                >
                    <Input
                        id="totalPago"
                        type="money"
                        label="Total pago até agora"
                        variant="display"
                        readonly
                        :value="totalPagoDisplay"
                    />

                    <Button
                        v-if="!isView"

                        type="button"
                        variant="outline"
                        class="w-full"
                        left-icon="fa-money-bill"
                        :label="pagamentosButtonLabel"

                        @click="$emit('click:pagamentos')"
                    />
                </div>
            </div>
        </div>

        <Input
            id="obs"
            type="textarea"
            label="Observações"
            :variant="isView ? 'display' : 'secondary'"
            :readonly="isView"
            :value="formValues.obs"
            :error="fieldError('obs')"

            @update:value="updateValue('obs', $event)"
        />

        <CriadoModificadoFields
            v-if="isView || restrictedEdit"

            id-prefix="os"
            :criado-em="formValues.criadoEm"
            :modificado-em="formValues.modificadoEm"
        />
    </form>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Input from "@design/components/Input.vue";
import Marker from "@design/components/Marker.vue";
import Select from "@design/components/Select.vue";
import { VEICULO_TIPO_OPTIONS } from "@shared/mecarvit/veiculoTipos";
import { formatDateInputValue } from "@shared/format/dateTime";
import { moneyAmountToInputDigits, parseMoneyInput } from "@shared/format/moneyInput";
import { documentDigits, type DialogMode } from "../js/crudHttp";
import { currentUsuarioCpfDigits } from "../js/mecarvit";
import { sumPagamentosValor, type PagamentoFormRow } from "../js/pagamentoOptions";
import CriadoModificadoFields from "./CriadoModificadoFields.vue";
import OrdemServicoItensSection, {
    type OrdemServicoItemFormRow
} from "./OrdemServicoItensSection.vue";

export type SelectOption = {
    label: string;
    value: string;
};

export type ClienteSelectOption = SelectOption & {
    cel?: string;
};

export type VeiculoSelectOption = SelectOption & {
    clienteDocumento: string;
    modelo: string;
    placa: string;
    kilometragem: string;
    tipo: string;
};

export type OrdemServicoFormValues = {
    id?: number;
    clienteDocumento: string;
    clienteNome: string;
    clienteCpfNovo: string;
    clienteCel: string;
    veiculoId: string;
    veiculoModelo: string;
    veiculoPlaca: string;
    veiculoKilometragem: string;
    veiculoTipo: string;
    statusOsId: string;
    dataInicio: string;
    dataConclusao: string;
    dataLimitePagamento: string;
    diagnosticoCliente: string;
    diagnosticoMecanico: string;
    obs: string;
    responsaveisCpfs: string[];
    itens: OrdemServicoItemFormRow[];
    criadoEm: string;
    modificadoEm: string;
};

type ServicoSuggestion = {
    id: number;
    nome: string;
};

export function emptyOrdemServicoFormValues(options?: {
    defaultStatusId?: string;
    dataInicioToday?: boolean;
}): OrdemServicoFormValues {
    const defaultStatusId = options?.defaultStatusId ?? "1";

    return {
        clienteDocumento: "",
        clienteNome: "",
        clienteCpfNovo: "",
        clienteCel: "",
        veiculoId: "",
        veiculoModelo: "",
        veiculoPlaca: "",
        veiculoKilometragem: "",
        veiculoTipo: "",
        statusOsId: defaultStatusId,
        dataInicio: options?.dataInicioToday ? formatDateInputValue(new Date()) : "",
        dataConclusao: "",
        dataLimitePagamento: "",
        diagnosticoCliente: "",
        diagnosticoMecanico: "",
        obs: "",
        responsaveisCpfs: [],
        itens: [],
        criadoEm: "",
        modificadoEm: ""
    };
}

export function mergeOrdemServicoFormValues(
    partial?: Partial<OrdemServicoFormValues>
): OrdemServicoFormValues {
    const base = emptyOrdemServicoFormValues();

    if (!partial) {
        return base;
    }

    return {
        ...base,
        ...partial,
        clienteDocumento: String(partial.clienteDocumento ?? base.clienteDocumento),
        clienteNome: String(partial.clienteNome ?? base.clienteNome),
        clienteCpfNovo: String(partial.clienteCpfNovo ?? base.clienteCpfNovo),
        clienteCel: String(partial.clienteCel ?? base.clienteCel),
        veiculoId: String(partial.veiculoId ?? base.veiculoId),
        veiculoModelo: String(partial.veiculoModelo ?? base.veiculoModelo),
        veiculoPlaca: String(partial.veiculoPlaca ?? base.veiculoPlaca),
        veiculoKilometragem: String(partial.veiculoKilometragem ?? base.veiculoKilometragem),
        veiculoTipo: String(partial.veiculoTipo ?? base.veiculoTipo),
        statusOsId: String(partial.statusOsId ?? base.statusOsId),
        dataInicio: String(partial.dataInicio ?? base.dataInicio),
        dataConclusao: String(partial.dataConclusao ?? base.dataConclusao),
        dataLimitePagamento: String(partial.dataLimitePagamento ?? base.dataLimitePagamento),
        diagnosticoCliente: String(partial.diagnosticoCliente ?? base.diagnosticoCliente),
        diagnosticoMecanico: String(partial.diagnosticoMecanico ?? base.diagnosticoMecanico),
        obs: String(partial.obs ?? base.obs),
        responsaveisCpfs: Array.isArray(partial.responsaveisCpfs)
            ? partial.responsaveisCpfs.map((cpf) => documentDigits(cpf)).filter(Boolean)
            : [...base.responsaveisCpfs],
        criadoEm: String(partial.criadoEm ?? base.criadoEm),
        modificadoEm: String(partial.modificadoEm ?? base.modificadoEm),
        itens: [...(partial.itens ?? base.itens)]
    };
}

function ordemServicoFieldText(
    values: OrdemServicoFormValues,
    field: keyof OrdemServicoFormValues
): string {
    const value = values[field];

    return String(value ?? "").trim();
}

export default defineComponent({
    name: "OrdemServicoForm",

    components: {
        Button,
        CriadoModificadoFields,
        Input,
        Marker,
        OrdemServicoItensSection,
        Select
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

        orcamento: {
            type: Boolean,
            default: false
        },

        restrictedEdit: {
            type: Boolean,
            default: false
        },

        canSeeClientePii: {
            type: Boolean,
            default: true
        },

        canSeePagamentos: {
            type: Boolean,
            default: true
        },

        canEditItens: {
            type: Boolean,
            default: true
        },

        values: {
            type: Object as PropType<OrdemServicoFormValues>,
            required: true
        },

        clienteOptions: {
            type: Array as PropType<ClienteSelectOption[]>,
            default: () => []
        },

        veiculoOptions: {
            type: Array as PropType<VeiculoSelectOption[]>,
            default: () => []
        },

        funcionarioOptions: {
            type: Array as PropType<SelectOption[]>,
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

        pagamentosButtonLabel: {
            type: String,
            default: "Gerenciar pagamentos"
        },

        pagamentos: {
            type: Array as PropType<PagamentoFormRow[]>,
            default: () => []
        },

        errors: {
            type: Object as PropType<Record<string, string>>,
            default: () => ({})
        }
    },

    emits: ["submit", "search:external", "search:servico", "change:cliente", "click:pagamentos"],

    data() {
        return {
            formValues: mergeOrdemServicoFormValues(this.values),
            veiculoTipoQuery: "",
            localErrors: {} as Record<string, string>
        };
    },

    computed: {
        isView(): boolean {
            return this.mode === "view";
        },

        isCoreReadonly(): boolean {
            return this.isView || this.restrictedEdit;
        },

        itensMode(): DialogMode {
            if (this.isView || !this.canEditItens) {
                return "view";
            }

            return this.mode;
        },

        isOrcamentoMode(): boolean {
            return this.formValues.statusOsId === "6" || (this.mode === "create" && this.orcamento);
        },

        showStatusField(): boolean {
            return this.mode !== "create";
        },

        showStatusBlock(): boolean {
            return this.statusOptions.length > 0 && (this.showStatusField || !this.isOrcamentoMode);
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

        funcionarioSearch() {
            return {
                external: true,
                field: "nome"
            };
        },

        funcionarioOptionsWithSelectedStubs(): SelectOption[] {
            const options = [...this.funcionarioOptions];
            const present = new Set(options.map((option) => documentDigits(option.value)));

            for (const cpf of this.formValues.responsaveisCpfs) {
                const digits = documentDigits(cpf);

                if (!digits || present.has(digits)) {
                    continue;
                }

                present.add(digits);
                options.unshift({ label: digits, value: digits });
            }

            return options;
        },

        funcionarioSelectOptionsResolved(): SelectOption[] {
            const current = currentUsuarioCpfDigits();

            return this.funcionarioOptionsWithSelectedStubs.filter(
                (option) => !current || documentDigits(option.value) !== current
            );
        },

        responsaveisViewItems(): Array<{ label: string; value: string }> {
            const options = this.funcionarioOptionsWithSelectedStubs;

            return this.formValues.responsaveisCpfs
                .map((cpf) => {
                    const digits = documentDigits(cpf);

                    if (!digits) {
                        return null;
                    }

                    const found = options.find((option) => documentDigits(option.value) === digits);

                    return {
                        value: digits,
                        label: found?.label ?? digits
                    };
                })
                .filter((item): item is { label: string; value: string } => item != null);
        },

        veiculoTipoOptions(): SelectOption[] {
            return VEICULO_TIPO_OPTIONS.map((option) => ({
                label: option.label,
                value: option.value
            }));
        },

        hasClienteSelecionado(): boolean {
            return Boolean(String(this.formValues.clienteDocumento ?? "").trim());
        },

        showClienteCpfField(): boolean {
            if (this.isCoreReadonly || !this.canSeeClientePii) {
                return false;
            }

            return (
                !this.hasClienteSelecionado &&
                Boolean(ordemServicoFieldText(this.formValues, "clienteNome"))
            );
        },

        showClienteCelField(): boolean {
            if (!this.canSeeClientePii) {
                return false;
            }

            if (this.isCoreReadonly) {
                return Boolean(ordemServicoFieldText(this.formValues, "clienteCel"));
            }

            return (
                this.hasClienteSelecionado ||
                (!this.hasClienteSelecionado &&
                    Boolean(ordemServicoFieldText(this.formValues, "clienteNome")))
            );
        },

        canEditVeiculoFields(): boolean {
            return (
                this.hasClienteSelecionado ||
                Boolean(ordemServicoFieldText(this.formValues, "clienteNome"))
            );
        },

        filteredVeiculoOptions(): VeiculoSelectOption[] {
            const documento = this.formValues.clienteDocumento;

            if (!documento) {
                return [];
            }

            return this.veiculoOptions.filter((option) => option.clienteDocumento === documento);
        },

        veiculoModeloOptions(): SelectOption[] {
            return this.filteredVeiculoOptions.map((option) => ({
                label: option.modelo,
                value: option.value
            }));
        },

        clienteLabel(): string {
            const found = this.clienteOptions.find(
                (option) => option.value === this.formValues.clienteDocumento
            );

            if (found) {
                return found.label;
            }

            return this.formValues.clienteNome || this.formValues.clienteDocumento || "—";
        },

        veiculoLabel(): string {
            const found = this.veiculoOptions.find(
                (option) => option.value === this.formValues.veiculoId
            );

            if (found) {
                return `${found.modelo} · ${found.placa}`;
            }

            return this.formValues.veiculoModelo || "—";
        },

        veiculoTipoLabel(): string {
            const found = this.veiculoTipoOptions.find(
                (option) => option.value === this.formValues.veiculoTipo
            );

            return found?.label || this.formValues.veiculoTipo || "—";
        },

        statusLabel(): string {
            const found = this.statusOptions.find(
                (option) => option.value === this.formValues.statusOsId
            );

            return found?.label || this.formValues.statusOsId || "—";
        },

        totalsDisplay(): { total: string } {
            let total = 0;

            for (const item of this.formValues.itens ?? []) {
                const qty = Number(item.quantidade);
                const quantidade = Number.isFinite(qty) && qty > 0 ? qty : 0;
                const valor = parseMoneyInput(item.valor) ?? 0;

                total += quantidade * valor;
            }

            return {
                total: moneyAmountToInputDigits(total)
            };
        },

        totalPagoDisplay(): string {
            return moneyAmountToInputDigits(sumPagamentosValor(this.pagamentos));
        }
    },

    watch: {
        values: {
            deep: true,
            handler(next: OrdemServicoFormValues) {
                this.formValues = mergeOrdemServicoFormValues(next);
                this.syncVeiculoTipoQuery();
                this.localErrors = {};
            }
        }
    },

    mounted() {
        this.syncVeiculoTipoQuery();
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

        onClienteQuery(value: string) {
            this.updateValue("clienteNome", value);

            if (!this.hasClienteSelecionado) {
                this.updateValue("clienteCpfNovo", "");
            }
        },

        onResponsaveisChange(value: string | string[]) {
            const raw = Array.isArray(value) ? value : value ? [value] : [];
            const current = currentUsuarioCpfDigits();
            const next = raw
                .map((cpf) => documentDigits(cpf))
                .filter((cpf) => Boolean(cpf) && cpf !== current);

            this.updateValue("responsaveisCpfs", next);
        },

        onClienteSelect(documento: string) {
            if (!documento) {
                this.updateValue("clienteDocumento", "");
                this.updateValue("clienteCpfNovo", "");
                this.updateValue("clienteCel", "");
                this.resetVeiculoIfNeeded();

                return;
            }

            this.updateValue("clienteDocumento", documento);
            this.updateValue("clienteCpfNovo", "");

            const found = this.clienteOptions.find((option) => option.value === documento);

            if (found) {
                this.updateValue("clienteNome", found.label);
                this.updateValue("clienteCel", found.cel ?? "");
            }

            this.resetVeiculoIfNeeded();
            this.$emit("change:cliente", documento);
        },

        onVeiculoModeloQuery(value: string) {
            this.updateValue("veiculoModelo", value);

            if (this.formValues.veiculoId) {
                this.updateValue("veiculoId", "");
                this.updateValue("veiculoPlaca", "");
                this.updateValue("veiculoKilometragem", "");
                this.updateValue("veiculoTipo", "");
                this.veiculoTipoQuery = "";
            }
        },

        onVeiculoSelect(veiculoId: string) {
            if (!veiculoId) {
                this.updateValue("veiculoId", "");
                this.updateValue("veiculoPlaca", "");
                this.updateValue("veiculoKilometragem", "");
                this.updateValue("veiculoTipo", "");
                this.veiculoTipoQuery = "";

                return;
            }

            const found = this.filteredVeiculoOptions.find((option) => option.value === veiculoId);

            this.updateValue("veiculoId", veiculoId);

            if (!found) {
                return;
            }

            this.updateValue("veiculoModelo", found.modelo);
            this.updateValue("veiculoPlaca", found.placa);
            this.updateValue("veiculoKilometragem", found.kilometragem);
            this.updateValue("veiculoTipo", found.tipo);
            this.syncVeiculoTipoQuery();
        },

        resetVeiculoIfNeeded() {
            const documento = this.formValues.clienteDocumento;
            const current = this.veiculoOptions.find(
                (option) => option.value === this.formValues.veiculoId
            );

            if (current && current.clienteDocumento === documento) {
                return;
            }

            this.updateValue("veiculoId", "");
            this.updateValue("veiculoModelo", "");
            this.updateValue("veiculoPlaca", "");
            this.updateValue("veiculoKilometragem", "");
            this.updateValue("veiculoTipo", "");
            this.veiculoTipoQuery = "";
        },

        syncVeiculoTipoQuery() {
            const found = this.veiculoTipoOptions.find(
                (option) => option.value === this.formValues.veiculoTipo
            );

            this.veiculoTipoQuery = found?.label ?? this.formValues.veiculoTipo;
        },

        onVeiculoTipoSelect(value: string) {
            this.updateValue("veiculoTipo", value);
            this.syncVeiculoTipoQuery();
        },

        onVeiculoTipoQuery(value: string) {
            this.veiculoTipoQuery = value;

            if (!this.formValues.veiculoTipo) {
                this.updateValue("veiculoTipo", value.trim().toLowerCase());
            }
        },

        onSubmit() {
            const errors: Record<string, string> = {};

            const hasCliente =
                Boolean(ordemServicoFieldText(this.formValues, "clienteDocumento")) ||
                Boolean(ordemServicoFieldText(this.formValues, "clienteNome"));

            if (!hasCliente) {
                errors.clienteNome = "Cliente é obrigatório";
            }

            if (
                !ordemServicoFieldText(this.formValues, "clienteDocumento") &&
                ordemServicoFieldText(this.formValues, "clienteNome")
            ) {
                if (!ordemServicoFieldText(this.formValues, "clienteCpfNovo")) {
                    errors.clienteCpfNovo = "CPF é obrigatório para novo cliente";
                }
            }

            const hasVeiculo =
                Boolean(this.formValues.veiculoId) ||
                Boolean(ordemServicoFieldText(this.formValues, "veiculoModelo"));

            if (!hasVeiculo) {
                errors.veiculoModelo = "Modelo do veículo é obrigatório";
            }

            if (!this.formValues.veiculoId) {
                if (!ordemServicoFieldText(this.formValues, "veiculoPlaca")) {
                    errors.veiculoPlaca = "Placa é obrigatória";
                }
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
