<template>
    <div>
        <div
            v-if="hasResumo"

            class="mb-2 rounded border px-3 py-2 text-sm"
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

            class="mb-3 text-sm text-muted-foreground"
        >
            Nenhum pagamento lançado.
        </small>

        <div
            v-else

            class="mb-3 flex flex-col gap-2 overflow-y-auto"
        >
            <div
                v-for="(row, index) in localRows"
                :key="rowKey(row, index)"

                class="flex items-center justify-between gap-2 rounded border px-3 py-2 text-sm transition-all"
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
                        aria-label="Cancelar edição"

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

        <div
            v-if="!readonly"

            class="flex flex-col gap-4 border-t pt-2"
        >
            <h5 class="text-sm font-semibold">
                {{ editingIndex === null ? "Novo pagamento" : "Editar pagamento" }}
            </h5>

            <Select
                id="pagamento-tipo"
                label="Tipo"
                placeholder="Selecione o tipo"
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

            <div class="flex flex-wrap justify-end gap-2">
                <Button
                    variant="primary"
                    type="button"
                    :disabled="saving"
                    :label="editingIndex === null ? 'Adicionar pagamento' : 'Aplicar alteração'"

                    @click.stop.prevent="onApplyForm"
                />

                <Button
                    v-if="hasUnappliedDraft || editingIndex !== null"

                    variant="secondary"
                    type="button"
                    :disabled="saving"
                    label="Cancelar"

                    @click.stop.prevent="resetForm"
                />
            </div>
        </div>
    </div>
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
    name: "PagamentosEditor",

    components: {
        Button,
        Input,
        Select
    },

    props: {
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

    emits: ["update:rows"],

    data() {
        return {
            PAGAMENTO_SELECT_OPTIONS,
            formatMoneyBrl,
            pagamentoLabel,
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

        valorPagoAtual(): number {
            return sumPagamentosValor(this.localRows);
        }
    },

    watch: {
        rows: {
            handler() {
                this.syncFromProps();
            },
            deep: true,
            immediate: true
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

        emitRows() {
            this.$emit(
                "update:rows",
                this.localRows.map((row) => ({ ...row }))
            );
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

            this.emitRows();
        },

        onApplyForm() {
            const valorNum = parseMoneyInput(this.valor);

            if (String(this.valor ?? "").trim() === "" || valorNum === null) {
                this.$toast.error("Informe o tipo e um valor maior que zero.");
                return;
            }

            const tipoFinal = (this.tipo ?? "").toString().trim() || "pix";
            this.tipo = tipoFinal;

            if (!tipoFinal || valorNum <= 0) {
                this.$toast.error("Informe o tipo e um valor maior que zero.");

                return;
            }

            if (Number.isFinite(this.valorTotal)) {
                const currentSum = this.localRows.reduce((sum, row, index) => {
                    if (index === this.editingIndex) {
                        return sum;
                    }

                    return sum + (parseStoredMoneyAmount(row.valor) ?? 0);
                }, 0);

                if (currentSum + valorNum > Number(this.valorTotal) + 0.009) {
                    this.$toast.error(
                        "A soma dos pagamentos não pode ser maior que o valor do lançamento."
                    );

                    return;
                }
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
            this.emitRows();
        },

        pagamentosPayload(): Array<{ id?: number; tipo: string; valor: number }> {
            return this.localRows.map((row) => ({
                ...(row.id != null ? { id: row.id } : {}),
                tipo: row.tipo,
                valor: Number(row.valor)
            }));
        }
    }
});
</script>
