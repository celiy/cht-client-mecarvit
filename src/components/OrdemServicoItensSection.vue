<template>
    <section class="flex flex-col gap-3">
        <div class="overflow-hidden rounded border">
            <div class="overflow-x-auto">
                <table class="w-full table-fixed border-collapse text-sm">
                    <thead>
                        <tr class="text-sm font-semibold text-foreground">
                            <th
                                scope="col"
                                class="border-b px-3 py-2 text-left"
                            >
                                Serviço
                            </th>

                            <th
                                scope="col"
                                class="w-16 border-b border-l px-3 py-2 text-left sm:w-26"
                            >
                                <span v-if="$project.device.isMobile">Qtd.</span>
                                <span v-else>Quantidade</span>
                            </th>

                            <th
                                scope="col"
                                class="overflow-x-hidden border-b border-l px-3 py-2 text-left text-nowrap"
                            >
                                Valor
                            </th>

                            <th
                                v-if="!isView"

                                scope="col"
                                class="w-10 border-b border-l px-1 py-2 sm:w-20"
                            >
                                <span v-if="$project.device.isMobile">...</span>
                                <span v-else>Ações</span>
                            </th>
                        </tr>
                    </thead>

                    <tbody class="[&>tr:last-child>td]:border-b-0">
                        <template v-if="isView">
                            <tr
                                v-for="(row, index) in items"
                                :key="`view-${index}`"

                                class="text-foreground"
                            >
                                <td class="min-w-0 border-b px-3 py-2 align-top break-words">
                                    <span class="block break-words whitespace-normal">
                                        {{ row.servicoNome || "—" }}
                                    </span>
                                </td>

                                <td class="border-b border-l px-3 py-2 align-middle tabular-nums">
                                    {{ row.quantidade || "—" }}
                                </td>

                                <td class="border-b border-l px-3 py-2 align-middle tabular-nums">
                                    {{ moneyLabel(row.valor) }}
                                </td>
                            </tr>

                            <tr v-if="items.length === 0">
                                <td
                                    colspan="3"
                                    class="px-3 py-6 text-center text-muted-foreground"
                                >
                                    Nenhum serviço lançado.
                                </td>
                            </tr>
                        </template>

                        <template v-else>
                            <tr
                                v-for="(row, index) in items"
                                :key="`item-${index}`"
                            >
                                <td
                                    class="min-w-0 border-b align-top break-words focus-within:bg-accent/40"
                                >
                                    <Select
                                        :id="committedFieldId(index, 'servico')"
                                        combobox
                                        combobox-multiline
                                        variant="transparent"
                                        :query="row.servicoNome"
                                        :model-value="
                                            row.servicoId != null ? String(row.servicoId) : ''
                                        "
                                        :options="servicoSelectOptions"
                                        :search="servicoSearch"
                                        :mobile-modal="false"
                                        :external-search-loading="servicoSearchLoading"

                                        @keydown.enter="preventRowEnter"
                                        @update:query="onItemServicoNomeInput(index, $event)"
                                        @update:value="onItemServicoSelectValue(index, $event)"
                                        @search:external="onServicoSearchExternal"
                                    >
                                        <template #inside-empty-panel>
                                            <span
                                                v-if="
                                                    servicoEnterHintVisible(
                                                        row.servicoNome,
                                                        row.servicoId
                                                    )
                                                "

                                                :data-os-suggestions-empty="true"
                                                class="mt-1 block px-1 text-xs text-muted-foreground"
                                            >
                                                Pressione Enter para usar este nome.
                                            </span>
                                        </template>
                                    </Select>
                                </td>

                                <td
                                    class="border-b border-l align-middle focus-within:bg-accent/40"
                                >
                                    <Input
                                        :id="committedFieldId(index, 'quantidade')"
                                        type="number"
                                        variant="transparent"
                                        no-shadow
                                        :value="row.quantidade"

                                        @keydown.enter="preventRowEnter"
                                        @update:value="patchItem(index, 'quantidade', $event)"
                                    />
                                </td>

                                <td
                                    class="border-b border-l align-middle focus-within:bg-accent/40"
                                >
                                    <Input
                                        :id="committedFieldId(index, 'valor')"
                                        type="money"
                                        variant="transparent"
                                        no-shadow
                                        :value="row.valor"

                                        @keydown.enter="preventRowEnter"
                                        @update:value="patchItem(index, 'valor', $event)"
                                    />
                                </td>

                                <td class="border-b border-l px-1 py-1 text-center align-middle">
                                    <Button
                                        v-tooltip="'Remover serviço'"
                                        type="button"
                                        variant="transparent"
                                        size="small"
                                        class="p-1.5!"
                                        aria-label="Remover serviço"

                                        @click="removeItem(index)"
                                    >
                                        <span class="fa-solid fa-trash text-xs text-destructive" />
                                    </Button>
                                </td>
                            </tr>

                            <tr>
                                <td class="align-middle focus-within:bg-accent/40">
                                    <Select
                                        id="os-item-servico-nome"
                                        ref="servicoSelect"

                                        combobox
                                        variant="transparent"
                                        :query="draft.servicoNome"
                                        :model-value="
                                            draft.servicoId != null ? String(draft.servicoId) : ''
                                        "
                                        :options="servicoSelectOptions"
                                        :search="servicoSearch"
                                        :mobile-modal="false"
                                        :external-search-loading="servicoSearchLoading"

                                        @keydown.enter="onServicoEnter"
                                        @update:query="onServicoNomeInput"
                                        @update:value="onServicoSelectValue"
                                        @search:external="onServicoSearchExternal"
                                    >
                                        <!--
                                        Also the marker that tells Enter apart: an open
                                        panel with no suggestion lets the field go, an open
                                        panel with suggestions is driven by the list itself.
                                    -->
                                        <template #inside-empty-panel>
                                            <span
                                                v-if="
                                                    servicoEnterHintVisible(
                                                        draft.servicoNome,
                                                        draft.servicoId
                                                    )
                                                "

                                                :data-os-suggestions-empty="true"
                                                class="mt-1 block px-1 text-xs text-muted-foreground"
                                            >
                                                Pressione Enter para usar este nome.
                                            </span>
                                        </template>
                                    </Select>
                                </td>

                                <td class="border-l align-middle focus-within:bg-accent/40">
                                    <Input
                                        id="os-item-quantidade"
                                        type="number"
                                        variant="transparent"
                                        no-shadow
                                        :value="draft.quantidade"

                                        @keydown.enter="onQuantidadeEnter"
                                        @update:value="updateDraft('quantidade', $event)"
                                    />
                                </td>

                                <td class="border-l align-middle focus-within:bg-accent/40">
                                    <Input
                                        id="os-item-valor"
                                        type="money"
                                        variant="transparent"
                                        no-shadow
                                        :value="draft.valor"

                                        @keydown.enter="onValorEnter"
                                        @update:value="updateDraft('valor', $event)"
                                    />
                                </td>

                                <td class="border-l px-1 py-1 text-center align-middle">
                                    <Button
                                        v-tooltip="'Adicionar serviço'"
                                        type="button"
                                        variant="transparent"
                                        size="small"
                                        class="p-1.5!"
                                        aria-label="Adicionar serviço"

                                        @click="commitDraft"
                                    >
                                        <span class="fa-solid fa-plus text-xs" />
                                    </Button>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

        <Item
            v-if="draftErrorMessage"

            icon="fa-circle-xmark"
            variant="destructive"
            type="alert"
            :description="draftErrorMessage"

            @click="clearDraftErrorMessage"
        />
    </section>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Input from "@design/components/Input.vue";
import Item from "@design/components/Item.vue";
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
    valor: string;
};

type ServicoSuggestion = {
    id: number;
    nome: string;
};

/**
 * Ids of the draft row fields, in the order Enter walks through them.
 *
 * The design system fields do not expose an imperative `focus()`, so the ids
 * rendered on the inner `<input>` are the handle used to move the caret.
 */
const FIELD_IDS = {
    servico: "os-item-servico-nome",
    quantidade: "os-item-quantidade",
    valor: "os-item-valor"
} as const;

type DraftField = keyof typeof FIELD_IDS;

function emptyDraft(): OrdemServicoItemFormRow {
    return {
        servicoNome: "",
        quantidade: "1",
        valor: ""
    };
}

/**
 * Marker rendered through `#inside-empty-panel`: it only exists while the
 * suggestion panel is open with nothing to pick.
 */
const EMPTY_SUGGESTIONS_ATTRIBUTE = "data-os-suggestions-empty";

/**
 * The suggestion panel is teleported to `body`, so its presence in the document
 * is what tells whether Enter belongs to the option list. Mirrors the check
 * `OptionsList` runs before consuming the key.
 */
function optionsPanelIsOpen(): boolean {
    return Array.from(document.querySelectorAll("[data-cht-floating-panel]")).some(
        (panel) => panel instanceof HTMLElement && panel.getClientRects().length > 0
    );
}

/**
 * True when the open panel actually offers a service to highlight. With nothing
 * to pick the list still swallows Enter, so the field has to walk on by itself.
 */
function suggestionsPanelHasOptions(): boolean {
    if (!optionsPanelIsOpen()) {
        return false;
    }

    const emptyHint = document.querySelector(`[${EMPTY_SUGGESTIONS_ATTRIBUTE}]`);

    return !(emptyHint instanceof HTMLElement && emptyHint.getClientRects().length > 0);
}

function servicoEnterHintVisible(
    nome: string,
    servicoId: string | number | null | undefined
): boolean {
    const trimmed = String(nome ?? "").trim();

    if (!trimmed) {
        return false;
    }

    if (servicoId != null && String(servicoId) !== "") {
        return false;
    }

    return true;
}

export default defineComponent({
    name: "OrdemServicoItensSection",

    components: {
        Button,
        Input,
        Item,
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
        },

        servicoSearchLoading: {
            type: Boolean,
            default: false
        }
    },

    emits: ["update:items", "search:servico"],

    data() {
        return {
            servicoSearch: {
                external: true,
                field: "nome"
            },
            draft: emptyDraft() as OrdemServicoItemFormRow,
            localErrors: {} as Record<string, string>
        };
    },

    computed: {
        isView(): boolean {
            return this.mode === "view";
        },

        servicoSelectOptions(): OptionItem[] {
            return this.servicoSuggestions.map((servico) => ({
                label: servico.nome,
                value: String(servico.id)
            }));
        },

        draftErrorMessage(): string {
            const merged = { ...this.errors, ...this.localErrors };

            return Object.values(merged).find((message) => Boolean(message)) ?? "";
        }
    },

    watch: {
        items: {
            handler(next: OrdemServicoItemFormRow[], prev?: OrdemServicoItemFormRow[]) {
                if (next.length !== (prev?.length ?? next.length)) {
                    this.localErrors = {};
                }
            }
        }
    },

    methods: {
        servicoEnterHintVisible,

        moneyLabel(value: string): string {
            const amount = parseMoneyInput(value);

            return amount == null || amount <= 0 ? "—" : formatMoneyBrl(amount);
        },

        preventRowEnter(event: KeyboardEvent) {
            event.preventDefault();
        },

        committedFieldId(index: number, field: DraftField): string {
            return `os-item-${index}-${field}`;
        },

        patchItem(index: number, field: keyof OrdemServicoItemFormRow, value: unknown) {
            const current = this.items[index];

            if (!current) {
                return;
            }

            this.emitItems(
                this.items.map((row, i) =>
                    i === index ? { ...row, [field]: String(value ?? "") } : row
                )
            );
        },

        onItemServicoNomeInput(index: number, value: unknown) {
            const current = this.items[index];

            if (!current) {
                return;
            }

            this.emitItems(
                this.items.map((row, i) =>
                    i === index
                        ? {
                              ...row,
                              servicoNome: String(value ?? ""),
                              servicoId: undefined
                          }
                        : row
                )
            );
        },

        onItemServicoSelectValue(index: number, value: unknown) {
            const raw = String(value ?? "").trim();
            const current = this.items[index];

            if (!current || !raw) {
                return;
            }

            const found = this.servicoSuggestions.find((servico) => String(servico.id) === raw);

            if (!found) {
                return;
            }

            this.emitItems(
                this.items.map((row, i) =>
                    i === index
                        ? {
                              ...row,
                              servicoId: found.id,
                              servicoNome: found.nome
                          }
                        : row
                )
            );
        },

        focusField(field: DraftField) {
            this.$nextTick(() => {
                document.getElementById(FIELD_IDS[field])?.focus();
            });
        },

        /**
         * The suggestion panel closes on an outside click, and Enter walks through
         * the row without one, so the field dismisses it when it moves on.
         */
        closeServicoSuggestions() {
            (this.$refs.servicoSelect as { close?: () => void } | undefined)?.close();
        },

        emitItems(next: OrdemServicoItemFormRow[]) {
            this.$emit("update:items", next);
        },

        updateDraft(field: keyof OrdemServicoItemFormRow, value: unknown) {
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
            this.closeServicoSuggestions();
            this.focusField("quantidade");
        },

        pickServico(option: ServicoSuggestion) {
            this.draft = {
                ...this.draft,
                servicoId: option.id,
                servicoNome: option.nome
            };
        },

        /**
         * Enter on the service name moves on, unless the option list is open with
         * something to pick: there Enter belongs to the panel, which selects and
         * then hands focus over through `update:value`.
         */
        onServicoEnter(event: KeyboardEvent) {
            if (suggestionsPanelHasOptions()) {
                return;
            }

            event.preventDefault();
            this.closeServicoSuggestions();
            this.focusField("quantidade");
        },

        onQuantidadeEnter(event: KeyboardEvent) {
            event.preventDefault();
            this.focusField("valor");
        },

        onValorEnter(event: KeyboardEvent) {
            event.preventDefault();
            this.commitDraft();
        },

        validateDraft(): boolean {
            const errors: Record<string, string> = {};
            const nome = this.draft.servicoNome.trim();
            const qty = Number(this.draft.quantidade);
            const valor = parseMoneyInput(this.draft.valor);

            if (!nome) {
                errors.servicoNome = "Nome do serviço é obrigatório.";
            }

            if (!Number.isFinite(qty) || qty < 1) {
                errors.quantidade = "Quantidade inválida.";
            }

            if (valor == null || valor <= 0) {
                errors.valor = "Informe o valor.";
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
                valor: this.draft.valor
            };

            this.emitItems([...this.items, row]);
            this.draft = emptyDraft();
            this.localErrors = {};
            this.focusField("servico");
        },

        removeItem(index: number) {
            this.emitItems(this.items.filter((_, i) => i !== index));
        },

        clearDraftErrorMessage() {
            this.localErrors = {};
        }
    }
});
</script>
