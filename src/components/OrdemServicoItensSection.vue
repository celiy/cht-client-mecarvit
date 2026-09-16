<template>
    <section class="flex flex-col gap-3">
        <h4 class="text-sm font-semibold text-foreground">Serviços</h4>

        <div
            v-for="(row, index) in lockedRows"
            :key="`locked-${index}-${row.servicoId ?? row.servicoNome}`"

            class="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2 text-sm"
        >
            <small class="flex min-w-0 flex-1 flex-row flex-wrap">
                <b>{{ row.servicoNome }}</b>

                <span>
                    · Quantidade: <b>{{ row.quantidade }}</b>
                </span>

                <span :class="{ 'text-muted-foreground!': !row.valorObra }">
                    · Obra: <b>{{ formatMoneyBrl(parseMoneyInput(row.valorObra) ?? 0) }}</b>
                </span>

                <span :class="{ 'text-muted-foreground!': !row.valorPecas }">
                    · Peças: <b>{{ formatMoneyBrl(parseMoneyInput(row.valorPecas) ?? 0) }}</b>
                </span>
            </small>

            <div
                v-if="!isView"

                class="flex shrink-0 items-center gap-1"
            >
                <Button
                    type="button"
                    variant="transparent"
                    size="small"
                    class="p-1.5!"
                    aria-label="Editar serviço"

                    @click="startEdit(index)"
                >
                    <span class="fa-solid fa-pen text-xs" />
                </Button>

                <Button
                    type="button"
                    variant="transparent"
                    size="small"
                    class="p-1.5!"
                    aria-label="Remover serviço"

                    @click="removeLocked(index)"
                >
                    <span class="fa-solid fa-trash text-xs text-destructive" />
                </Button>
            </div>
        </div>

        <div
            v-if="!isView"

            class="flex flex-col gap-2 rounded border border-dashed border-border p-3"
        >
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-12 lg:items-end">
                <div class="lg:col-span-4">
                    <Select
                        id="os-item-servico-nome"
                        combobox
                        header="Serviço"
                        :query="draft.servicoNome"
                        :model-value="draft.servicoId != null ? String(draft.servicoId) : ''"
                        :options="servicoSelectOptions"
                        :search="servicoSearch"
                        :error="fieldError('servicoNome')"
                        :mobile-modal="false"

                        @update:query="onServicoNomeInput"
                        @update:value="onServicoSelectValue"
                        @search:external="onServicoSearchExternal"
                    />
                </div>

                <div class="lg:col-span-2">
                    <Input
                        id="os-item-valor-obra"
                        type="money"
                        label="Valor obra"
                        variant="secondary"
                        :value="draft.valorObra"
                        :error="fieldError('valorObra')"

                        @update:value="updateDraft('valorObra', $event)"
                    />
                </div>

                <div class="lg:col-span-2">
                    <Input
                        id="os-item-valor-pecas"
                        type="money"
                        label="Valor peças"
                        variant="secondary"
                        :value="draft.valorPecas"
                        :error="fieldError('valorPecas')"

                        @update:value="updateDraft('valorPecas', $event)"
                    />
                </div>

                <div class="lg:col-span-2">
                    <Input
                        id="os-item-quantidade"
                        type="number"
                        label="Quantidade"
                        variant="secondary"
                        :value="draft.quantidade"
                        :error="fieldError('quantidade')"

                        @update:value="updateDraft('quantidade', $event)"
                    />
                </div>

                <div class="flex gap-1 lg:col-span-2 lg:justify-end">
                    <Button
                        type="button"
                        variant="outline"
                        size="small"
                        class="p-2!"
                        aria-label="Confirmar serviço"

                        @click.stop.prevent="commitDraft"
                    >
                        <span class="fa-solid fa-plus text-xs" />
                    </Button>
                </div>
            </div>
        </div>

        <p
            v-if="isView && lockedRows.length === 0"

            class="text-sm text-muted-foreground"
        >
            Nenhum serviço lançado.
        </p>
    </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Input from "@design/components/Input.vue";
import Select from "@design/components/Select.vue";
import type {
    OptionItem,
    SearchExternalPayload
} from "@design/components/internal/OptionsList.vue";
import { parseMoneyInput } from "@shared/format/moneyInput";
import { formatMoneyBrl } from "../js/crudHttp";

export type OrdemServicoItemFormRow = {
    servicoId?: number;
    servicoNome: string;
    quantidade: string;
    valorObra: string;
    valorPecas: string;
};

type ServicoSuggestion = {
    id: number;
    nome: string;
};

type DraftRow = OrdemServicoItemFormRow;

function emptyDraft(): DraftRow {
    return {
        servicoNome: "",
        quantidade: "1",
        valorObra: "",
        valorPecas: ""
    };
}

export default defineComponent({
    name: "OrdemServicoItensSection",

    components: {
        Button,
        Input,
        Select
    },

    props: {
        mode: {
            type: String as PropType<"create" | "edit" | "view">,
            default: "create"
        },

        items: {
            type: Array as PropType<OrdemServicoItemFormRow[]>,
            default: () => []
        },

        errors: {
            type: Object as PropType<Record<string, string>>,
            default: () => ({})
        },

        servicoSuggestions: {
            type: Array as PropType<ServicoSuggestion[]>,
            default: () => []
        }
    },

    emits: ["update:items", "search:servico"],

    data() {
        return {
            formatMoneyBrl,
            parseMoneyInput,
            servicoSearch: {
                external: true,
                field: "nome"
            },
            draft: emptyDraft() as DraftRow,
            editingFromIndex: null as number | null,
            localErrors: {} as Record<string, string>
        };
    },

    computed: {
        isView(): boolean {
            return this.mode === "view";
        },

        lockedRows(): OrdemServicoItemFormRow[] {
            return this.items;
        },

        servicoSelectOptions(): OptionItem[] {
            return this.servicoSuggestions.map((servico) => ({
                label: servico.nome,
                value: String(servico.id)
            }));
        }
    },

    watch: {
        items: {
            deep: true,
            handler() {
                this.localErrors = {};
            }
        }
    },

    methods: {
        fieldError(key: string): string | undefined {
            return this.localErrors[key] || this.errors[key];
        },

        emitItems(next: OrdemServicoItemFormRow[]) {
            this.$emit("update:items", next);
        },

        updateDraft(field: keyof DraftRow, value: unknown) {
            if (field === "servicoId") {
                return;
            }

            this.draft = {
                ...this.draft,
                [field]: String(value ?? "")
            };

            if (this.localErrors[field]) {
                const next = { ...this.localErrors };
                delete next[field];
                this.localErrors = next;
            }
        },

        onServicoNomeInput(value: unknown) {
            this.draft = {
                ...this.draft,
                servicoNome: String(value ?? ""),
                servicoId: undefined
            };

            if (this.localErrors.servicoNome) {
                const next = { ...this.localErrors };
                delete next.servicoNome;
                this.localErrors = next;
            }
        },

        onServicoSearchExternal(payload: SearchExternalPayload) {
            this.$emit("search:servico", payload.value.trim());
        },

        onServicoSelectValue(value: unknown) {
            const raw = String(value ?? "").trim();

            if (!raw) {
                this.draft = {
                    ...this.draft,
                    servicoId: undefined
                };

                return;
            }

            const found = this.servicoSuggestions.find((servico) => String(servico.id) === raw);

            if (!found) {
                return;
            }

            this.pickServico(found);
        },

        pickServico(option: ServicoSuggestion) {
            this.draft = {
                ...this.draft,
                servicoId: option.id,
                servicoNome: option.nome
            };
        },

        validateDraft(): boolean {
            const errors: Record<string, string> = {};
            const nome = this.draft.servicoNome.trim();
            const qty = Number(this.draft.quantidade);
            const obra = parseMoneyInput(this.draft.valorObra);
            const pecas = parseMoneyInput(this.draft.valorPecas);
            const hasObra = obra != null && obra > 0;
            const hasPecas = pecas != null && pecas > 0;

            if (!nome) {
                errors.servicoNome = "Nome do serviço é obrigatório";
            }

            if (!Number.isFinite(qty) || qty < 1) {
                errors.quantidade = "Quantidade inválida";
            }

            if (!hasObra && !hasPecas) {
                errors.valorObra = "Informe valor de obra ou de peças";
            }

            this.localErrors = errors;

            return Object.keys(errors).length === 0;
        },

        commitDraft() {
            if (!this.validateDraft()) {
                return;
            }

            const row: OrdemServicoItemFormRow = {
                servicoId: this.draft.servicoId,
                servicoNome: this.draft.servicoNome.trim(),
                quantidade: String(Math.round(Number(this.draft.quantidade))),
                valorObra: this.draft.valorObra,
                valorPecas: this.draft.valorPecas
            };

            this.editingFromIndex = null;
            this.emitItems([...this.items, row]);
            this.draft = emptyDraft();
            this.localErrors = {};
        },

        startEdit(index: number) {
            const row = this.items[index];

            if (!row) {
                return;
            }

            this.draft = { ...row };
            this.editingFromIndex = index;
            const next = this.items.filter((_, i) => i !== index);
            this.emitItems(next);
        },

        removeLocked(index: number) {
            const next = this.items.filter((_, i) => i !== index);
            this.emitItems(next);
        },

        applyFieldErrors(errors: Record<string, string>) {
            this.localErrors = { ...errors };
        }
    }
});
</script>
