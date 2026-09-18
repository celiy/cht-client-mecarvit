<template>
    <Modal
        :is-open="isOpen"
        size="small"

        @update:value="onOpenChange"
    >
        <template #header> Pagamentos </template>

        <template #body>
            <div
                v-if="hasResumo"

                class="mb-2 rounded border border-border bg-accent/20 px-3 py-2 text-sm"
            >
                <small>
                    <span class="text-muted-foreground">Valor do lançamento:</span>
                    {{ formatMoneyBrl(valorTotal) }}
                </small>

                <small class="mt-1">
                    <span class="text-muted-foreground">Já pago:</span>
                    {{ formatMoneyBrl(valorPagoAtual) }}
                </small>
            </div>

            <small
                v-if="localRows.length === 0"

                class="mb-2 text-sm text-muted-foreground"
            >
                Nenhum pagamento lançado.
            </small>

            <div
                v-else

                class="mb-2 flex flex-col gap-2 overflow-y-auto"
            >
                <div
                    v-for="(row, index) in localRows"
                    :key="rowKey(row, index)"

                    class="flex items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm transition-all"
                    :class="{
                        'border-primary!': editingIndex === index
                    }"
                >
                    <small>
                        {{ pagamentoLabel(row.tipo) }}
                        ·
                        <b>{{ pagamentoLinhaValor(row) }}</b>
                    </small>

                    <div
                        v-if="!readonly"

                        class="flex shrink-0 items-center gap-1"
                    >
                        <Button
                            v-if="index !== editingIndex"

                            type="button"
                            variant="transparent"
                            size="small"
                            class="p-1.5!"
                            aria-label="Editar pagamento"

                            @click="startEdit(index)"
                        >
                            <span class="fa-solid fa-pen text-xs" />
                        </Button>

                        <Button
                            v-else

                            type="button"
                            variant="transparent"
                            size="small"
                            class="p-1.5!"
                            aria-label="Editar pagamento"

                            @click="resetForm()"
                        >
                            <span class="fa-solid fa-x text-xs" />
                        </Button>

                        <Button
                            type="button"
                            variant="transparent-destructive"
                            size="small"
                            class="p-1.5!"
                            aria-label="Remover pagamento"

                            @click="removeAt(index)"
                        >
                            <span class="fa-solid fa-trash text-xs" />
                        </Button>
                    </div>
                </div>
            </div>

            <form
                v-if="!readonly"

                :id="formId"
                class="flex flex-col gap-4 border-t border-border pt-4"

                @submit.prevent.stop="onApplyForm"
                @keydown.enter.stop
            >
                <h5 class="text-sm font-semibold">
                    {{ editingIndex === null ? "Novo pagamento" : "Editar pagamento" }}
                </h5>

                <Select
                    id="pagamento-tipo"
                    header="Tipo"
                    :options="PAGAMENTO_SELECT_OPTIONS"
                    :model-value="tipo"

                    @update:value="tipo = $event"
                />

                <Input
                    id="pagamento-valor"
                    type="money"
                    label="Valor"
                    :value="valor"

                    @update:value="valor = String($event ?? '')"
                />
            </form>
        </template>

        <template #footer>
            <div class="flex flex-wrap justify-end gap-2">
                <Button
                    v-if="!readonly"

                    variant="primary"
                    type="button"
                    :disabled="saving"
                    :label="primaryActionLabel"

                    @click.stop.prevent="onPrimaryAction"
                />

                <Button
                    v-else

                    variant="primary"
                    type="button"
                    :disabled="saving"
                    label="Fechar"

                    @click.stop.prevent="onCancel"
                />

                <Button
                    v-if="!readonly"

                    variant="secondary"
                    type="button"
                    :disabled="saving"
                    :label="cancelButtonLabel"

                    @click.stop.prevent="onCancel"
                />
            </div>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Input from "@design/components/Input.vue";
import Select from "@design/components/Select.vue";
import {
    moneyAmountToInputDigits,
    parseMoneyInput,
    parseStoredMoneyAmount
} from "@shared/format/moneyInput";
import { formatDateTimeBr, latestDateValue } from "@shared/format/dateTime";
import { formatMoneyBrl } from "../js/crudHttp";
import {
    PAGAMENTO_SELECT_OPTIONS,
    pagamentoLabel,
    sumPagamentosValor,
    type PagamentoFormRow
} from "../js/pagamentoOptions";

export default defineComponent({
    name: "PagamentosModal",

    components: {
        Button,
        Input,
        Select
    },

    props: {
        isOpen: {
            type: Boolean,
            required: true
        },

        saving: {
            type: Boolean,
            default: false
        },

        valorTotal: {
            type: Number,
            required: false
        },

        rows: {
            type: Array as PropType<PagamentoFormRow[]>,
            default: () => []
        },

        readonly: {
            type: Boolean,
            default: false
        }
    },

    emits: ["update:isOpen", "save", "cancel"],

    data() {
        return {
            PAGAMENTO_SELECT_OPTIONS,
            formatMoneyBrl,
            pagamentoLabel,
            formId: "pagamentos-modal-form",
            localRows: [] as PagamentoFormRow[],
            editingIndex: null as number | null,
            tipo: "pix",
            valor: ""
        };
    },

    computed: {
        hasResumo(): boolean {
            return Number.isFinite(this.valorTotal);
        },

        hasUnappliedDraft(): boolean {
            return String(this.valor ?? "").trim() !== "";
        },

        primaryActionLabel(): string {
            if (!this.readonly && this.hasUnappliedDraft) {
                return this.editingIndex === null ? "Adicionar pagamento" : "Aplicar alteração";
            }

            return this.readonly ? "Fechar" : "Salvar";
        },

        cancelButtonLabel(): string {
            if (!this.readonly && this.hasUnappliedDraft) {
                return this.editingIndex === null ? "Cancelar pagamento" : "Cancelar alteração";
            }

            return this.readonly ? "Fechar" : "Cancelar";
        },

        valorPagoAtual(): number {
            return sumPagamentosValor(this.localRows);
        }
    },

    watch: {
        isOpen(open: boolean) {
            if (open) {
                this.syncFromProps();
            }
        },

        rows: {
            handler() {
                if (this.isOpen) {
                    this.syncFromProps();
                }
            },
            deep: true
        }
    },

    methods: {
        pagamentoLinhaValor(row: PagamentoFormRow): string {
            const valor = formatMoneyBrl(row.valor);
            const quando = formatDateTimeBr(latestDateValue(row.criadoEm, row.modificadoEm));

            if (quando === "—") {
                return valor;
            }

            return `${valor} | ${quando}`;
        },

        syncFromProps() {
            this.localRows = this.rows.map((row) => ({
                id: row.id,
                tipo: row.tipo,
                valor: String(row.valor),
                criadoEm: row.criadoEm,
                modificadoEm: row.modificadoEm
            }));
            this.resetForm();
        },

        rowKey(row: PagamentoFormRow, index: number): string {
            return row.id != null ? `p-${row.id}` : `p-local-${index}`;
        },

        resetForm() {
            this.editingIndex = null;
            this.tipo = "pix";
            this.valor = "";
        },

        startEdit(index: number) {
            const row = this.localRows[index];

            if (!row) {
                return;
            }

            this.editingIndex = index;
            this.tipo = row.tipo;
            this.valor = moneyAmountToInputDigits(parseStoredMoneyAmount(row.valor) ?? 0);
        },

        removeAt(index: number) {
            this.localRows = this.localRows.filter((_, i) => i !== index);

            if (this.editingIndex === index) {
                this.resetForm();
            } else if (this.editingIndex != null && this.editingIndex > index) {
                this.editingIndex -= 1;
            }
        },

        onPrimaryAction() {
            if (!this.readonly && this.hasUnappliedDraft) {
                this.onApplyForm();

                return;
            }

            this.onConfirm();
        },

        onApplyForm() {
            const tipoFinal = (this.tipo ?? "").toString().trim() || "pix";
            this.tipo = tipoFinal;

            const valorNum = parseMoneyInput(this.valor);

            if (!tipoFinal || valorNum === null || valorNum <= 0) {
                this.$toast.error("Informe o tipo e um valor maior que zero.");

                return;
            }

            const entry: PagamentoFormRow = {
                tipo: tipoFinal,
                valor: String(valorNum)
            };

            if (this.editingIndex === null) {
                this.localRows = [...this.localRows, entry];
            } else {
                const previous = this.localRows[this.editingIndex];

                this.localRows = this.localRows.map((row, index) => {
                    if (index !== this.editingIndex) {
                        return row;
                    }

                    return {
                        ...entry,
                        id: previous?.id,
                        criadoEm: previous?.criadoEm,
                        modificadoEm: previous?.modificadoEm
                    };
                });
            }

            this.resetForm();
        },

        pagamentosPayload(): Array<{ id?: number; tipo: string; valor: number }> {
            return this.localRows.map((row) => ({
                ...(row.id != null ? { id: row.id } : {}),
                tipo: row.tipo,
                valor: Number(row.valor)
            }));
        },

        onConfirm() {
            if (this.hasUnappliedDraft) {
                this.$toast.error(
                    'Aplique a alteração com "Adicionar à lista" ou "Aplicar alteração" antes de salvar.'
                );

                return;
            }

            this.$emit("save", this.pagamentosPayload());
        },

        onOpenChange(open: boolean) {
            this.$emit("update:isOpen", open);

            if (!open) {
                this.$emit("cancel");
            }
        },

        onCancel() {
            if (this.editingIndex) {
                this.resetForm();

                return;
            }

            if (!this.readonly && this.hasUnappliedDraft) {
                this.resetForm();

                return;
            }

            this.$emit("update:isOpen", false);
            this.$emit("cancel");
        }
    }
});
</script>
