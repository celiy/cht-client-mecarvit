<template>
    <main class="container-center container p-8">
        <div class="flex items-center justify-between">
            <h2 class="text-2xl font-semibold">
                {{ title }}
            </h2>

            <div>
                <slot name="headerActions">
                    <Button
                        v-if="showCreate"

                        label="Cadastrar"
                        left-icon="fa-plus"

                        @click="$emit('create')"
                    />
                </slot>
            </div>
        </div>

        <div
            v-if="showFilters"

            class="mt-2 mb-4"
        >
            <FilterInputs
                :filters="filters"
                :loading="loading"
                :filter-select-options="filterSelectOptions"

                @filters="$emit('filters', $event)"
                @reload="$emit('reload')"
                @search:external="$emit('search:external', $event)"
            />
        </div>

        <slot name="body">
            <div>
                <Table
                    :headers="headers"
                    :actions="actions"
                    :data="rows"
                    :loading="loading"

                    @click:action="onRowAction"
                >
                    <template #empty>
                        <EmptyTableMessage
                            :title="emptyTitle"
                            :description="emptyDescription"
                        />
                    </template>
                </Table>

                <Pagination
                    :id="paginationId"
                    :key="paginationKey"

                    class="mt-4"
                    :amount="pageCount"
                    :show-max="5"
                    :use-memo="true"

                    @update:page="$emit('page', $event)"
                />
            </div>
        </slot>

        <slot />

        <ConfirmationModal
            :is-open="deleteOpen"
            variant="destructive"
            title="Excluir"
            :description="deleteBody"
            confirm-text="Excluir"
            cancel-text="Cancelar"

            @confirm="onConfirmDelete"
            @cancel="closeDelete"
            @update:is-open="onDeleteOpenChange"
        />
    </main>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Pagination from "@design/components/custom/Pagination.vue";
import ConfirmationModal from "@design/components/custom/ConfirmationModal.vue";
import type { OptionItem } from "@design/components/internal/OptionsList.vue";
import { CRUD_ROW_ACTIONS, isCadastrarQuery } from "../js/crudHttp";
import FilterInputs, { type FilterDef } from "./FilterInputs.vue";
import EmptyTableMessage from "./EmptyTableMessage.vue";

import type { TableCellMaskFormat } from "@shared/format/displayMasks";
import type { TableHeaderBadgeProps } from "@design/components/Table.vue";

export type { TableHeaderBadgeProps };

export type TableHeader = {
    label: string;
    field?: string;
    position?: "start" | "center" | "end";
    format?: TableCellMaskFormat;
    badgeProps?: TableHeaderBadgeProps;
};

export default defineComponent({
    name: "CrudListPage",

    components: {
        Button,
        ConfirmationModal,
        EmptyTableMessage,
        FilterInputs,
        Pagination
    },

    props: {
        title: {
            type: String,
            required: true
        },

        showCreate: {
            type: Boolean,
            default: true
        },

        showFilters: {
            type: Boolean,
            default: true
        },

        filters: {
            type: Array as PropType<FilterDef[]>,
            default: () => []
        },

        filterSelectOptions: {
            type: Object as PropType<Record<string, OptionItem[]>>,
            default: () => ({})
        },

        loading: {
            type: Boolean,
            default: false
        },

        headers: {
            type: Array as PropType<TableHeader[]>,
            default: () => []
        },

        actions: {
            type: Array as PropType<OptionItem[]>,
            default: () => CRUD_ROW_ACTIONS
        },

        rows: {
            type: Array as PropType<Array<Record<string, unknown>>>,
            default: () => []
        },

        pageCount: {
            type: Number,
            default: 0
        },

        paginationId: {
            type: String,
            default: "pagination"
        },

        paginationKey: {
            type: [String, Number],
            default: "all"
        },

        deleteNameField: {
            type: String,
            default: "nome"
        },

        emptyTitle: {
            type: String,
            default: "Nenhum registro encontrado."
        },

        emptyDescription: {
            type: String,
            default: "Ajuste os filtros ou cadastre um novo registro."
        }
    },

    emits: [
        "create",
        "close-create",
        "filters",
        "reload",
        "page",
        "action",
        "delete",
        "search:external"
    ],

    data() {
        return {
            deleteOpen: false,
            pendingDelete: null as Record<string, unknown> | null
        };
    },

    computed: {
        deleteBody(): string {
            const name = String(this.pendingDelete?.[this.deleteNameField] ?? "").trim();

            if (name) {
                return `Excluir "${name}"? Esta ação não pode ser desfeita.`;
            }

            return "Excluir este item? Esta ação não pode ser desfeita.";
        }
    },

    watch: {
        "$route.query.cadastrar": {
            immediate: true,
            handler(value: unknown) {
                if (!isCadastrarQuery(value)) {
                    this.$emit("close-create");
                    return;
                }

                this.$nextTick(() => {
                    this.$emit("create");
                });
            }
        }
    },

    methods: {
        clearCadastrarQuery() {
            const query = { ...this.$route.query };

            if (!isCadastrarQuery(query.cadastrar)) {
                return;
            }

            delete query.cadastrar;

            void this.$router.replace({
                query,
                hash: this.$route.hash
            });
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value === "delete") {
                this.requestDelete(item);
                return;
            }

            this.$emit("action", value, item);
        },

        requestDelete(item: Record<string, unknown>) {
            this.pendingDelete = item;
            this.deleteOpen = true;
        },

        onConfirmDelete() {
            const item = this.pendingDelete;

            this.closeDelete();

            if (item) {
                this.$emit("delete", item);
            }
        },

        closeDelete() {
            this.deleteOpen = false;
            this.pendingDelete = null;
        },

        onDeleteOpenChange(open: boolean) {
            this.deleteOpen = open;

            if (!open) {
                this.pendingDelete = null;
            }
        }
    }
});
</script>
