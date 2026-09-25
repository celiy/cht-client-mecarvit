<template>
    <CrudListPage
        title="Logs do sistema"
        :filters="logFilters"
        :loading="loading"
        :headers="tableHeaders"
        :rows="tableRows"
        :actions="rowActions"
        :page-count="pageCount"
        pagination-id="pagination-audit-logs"
        :pagination-key="filtersKey"
        :show-create="false"
        :show-export="false"
        empty-title="Nenhum log encontrado."
        empty-description="Ajuste os filtros ou aguarde novas ações no sistema."

        @filters="onFilters"
        @reload="loadLogs"
        @page="onPage"
        @action="onRowAction"
    >
        <Modal
            :is-open="detailOpen"
            size="large"

            @update:value="detailOpen = $event"
        >
            <template #header> Detalhe do log </template>

            <template #body>
                <div
                    v-if="selected"

                    class="flex flex-col gap-4"
                >
                    <Toggleable
                        v-model="detailView"
                        label="Visualização"
                        label-position="center"
                        toggleable-position="center"
                        size="small"
                        :options="detailViewOptions"
                    />

                    <div
                        v-if="detailView === 'simple'"

                        class="flex flex-col gap-3 text-sm"
                    >
                        <div class="grid gap-2 sm:grid-cols-2">
                            <p>
                                <span class="text-muted-foreground">Quando:</span>
                                {{ formatDateTime(selected.occurredAt) }}
                            </p>

                            <p>
                                <span class="text-muted-foreground">Autor:</span>
                                {{ actorLabel(selected) }}
                            </p>

                            <p>
                                <span class="text-muted-foreground">Ação:</span>
                                {{ actionLabel(selected.action) }}
                            </p>

                            <p>
                                <span class="text-muted-foreground">Entidade:</span>
                                {{ entityLabel(selected.entity) }}
                                <span
                                    v-if="selected.entityId"

                                    class="text-muted-foreground"
                                >
                                    (#{{ selected.entityId }})
                                </span>
                            </p>

                            <p>
                                <span class="text-muted-foreground">Resultado:</span>
                                {{ selected.result === "success" ? "Sucesso" : "Falha" }}
                            </p>

                            <p v-if="selected.request?.ip">
                                <span class="text-muted-foreground">IP:</span>
                                {{ selected.request.ip }}
                            </p>

                            <p
                                v-if="selected.request?.method"

                                class="sm:col-span-2"
                            >
                                <span class="text-muted-foreground">Requisição:</span>
                                {{ selected.request.method }}
                                {{ selected.request.path }}
                            </p>
                        </div>

                        <div
                            v-if="selected.changes?.length"

                            class="flex flex-col gap-2"
                        >
                            <h4 class="text-base font-semibold">Alterações</h4>

                            <div
                                v-for="change in selected.changes"
                                :key="change.field"

                                class="rounded border border-border bg-accent/20 px-3 py-2"
                            >
                                <p class="font-medium">
                                    {{ change.field }}
                                </p>

                                <div class="mt-1 grid gap-2 sm:grid-cols-2">
                                    <div>
                                        <small class="text-muted-foreground">Antes</small>
                                        <pre
                                            class="mt-1 overflow-auto text-xs whitespace-pre-wrap"
                                            >{{ formatValue(change.before) }}</pre>
                                    </div>

                                    <div>
                                        <small class="text-muted-foreground">Depois</small>
                                        <pre
                                            class="mt-1 overflow-auto text-xs whitespace-pre-wrap"
                                            >{{ formatValue(change.after) }}</pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div
                            v-else-if="selected.before || selected.after"

                            class="grid gap-3 sm:grid-cols-2"
                        >
                            <div>
                                <h4 class="mb-1 text-base font-semibold">Antes</h4>
                                <pre
                                    class="overflow-auto rounded border border-border bg-accent/20 p-2 text-xs whitespace-pre-wrap"
                                    >{{ formatValue(selected.before) }}</pre>
                            </div>

                            <div>
                                <h4 class="mb-1 text-base font-semibold">Depois</h4>
                                <pre
                                    class="overflow-auto rounded border border-border bg-accent/20 p-2 text-xs whitespace-pre-wrap"
                                    >{{ formatValue(selected.after) }}</pre>
                            </div>
                        </div>
                    </div>

                    <div v-else>
                        <pre
                            class="max-h-[60vh] overflow-auto rounded border border-border bg-accent/20 p-3 text-xs whitespace-pre-wrap"
                            >{{ JSON.stringify(selected, null, 2) }}</pre>
                    </div>
                </div>
            </template>
        </Modal>
    </CrudListPage>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { toQueryString } from "@shared/frontend/queryString";
import type { FilterDef, FilterValues } from "../components/FilterInputs.vue";
import CrudListPage, { type TableHeader } from "../components/CrudListPage.vue";
import Modal from "@design/components/Modal.vue";
import Toggleable from "@design/components/Toggleable.vue";
import { notifyHttpError, pageCountFromTotal, type ListResponse } from "../js/crudHttp";

type AuditActor = {
    type: "user" | "system";
    id: string;
    name?: string;
    email?: string;
};

type AuditChange = {
    field: string;
    before: unknown;
    after: unknown;
};

type AuditLogEntry = {
    id: string;
    occurredAt: string;
    actor: AuditActor;
    action: string;
    entity: string;
    entityId?: string;
    result: "success" | "failure";
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    changes?: AuditChange[];
    request?: {
        method?: string;
        path?: string;
        ip?: string;
        userAgent?: string;
    };
};

type AuditRow = {
    id: string;
    occurredAt: string;
    actor: string;
    action: string;
    entity: string;
    entityId: string;
    result: string;
    _raw: AuditLogEntry;
};

const ACTION_LABELS: Record<string, string> = {
    create: "Criar",
    update: "Editar",
    delete: "Excluir"
};

const ENTITY_LABELS: Record<string, string> = {
    cliente: "Cliente",
    funcionario: "Funcionário",
    cargo: "Cargo",
    veiculo: "Veículo",
    servico: "Serviço",
    "ordem-servico": "Ordem de serviço"
};

export default defineComponent({
    name: "AuditLogsPage",

    components: {
        CrudListPage,
        Modal,
        Toggleable
    },

    data() {
        return {
            loading: false,
            page: 1,
            pageLimit: 20,
            pageCount: 1,
            filterValues: {} as FilterValues,
            filtersKey: "all",
            tableRows: [] as AuditRow[],
            detailOpen: false,
            selected: null as AuditLogEntry | null,
            detailView: "simple" as string | null,
            detailViewOptions: [
                { label: "Simples", value: "simple" },
                { label: "Avançado", value: "advanced" }
            ],
            rowActions: [{ label: "Visualizar", value: "inspect", icon: "fa-eye" }],
            tableHeaders: [
                { label: "Data", field: "occurredAt", position: "start" },
                { label: "Autor", field: "actor", position: "start" },
                { label: "Ação", field: "action", position: "start" },
                { label: "Entidade", field: "entity", position: "start" },
                { label: "ID", field: "entityId", position: "start" },
                { label: "Resultado", field: "result", position: "start" }
            ] as TableHeader[],
            logFilters: [
                {
                    type: "select",
                    value: "action",
                    label: "Ação",
                    default: true,
                    options: [
                        { label: "Criar", value: "create" },
                        { label: "Editar", value: "update" },
                        { label: "Excluir", value: "delete" }
                    ]
                },
                {
                    type: "select",
                    value: "entity",
                    label: "Entidade",
                    default: true,
                    options: [
                        { label: "Cliente", value: "cliente" },
                        { label: "Funcionário", value: "funcionario" },
                        { label: "Cargo", value: "cargo" },
                        { label: "Veículo", value: "veiculo" },
                        { label: "Serviço", value: "servico" },
                        { label: "Ordem de serviço", value: "ordem-servico" }
                    ]
                },
                {
                    type: "input",
                    value: "actor",
                    label: "Autor",
                    default: true
                },
                {
                    type: "input",
                    value: "from",
                    label: "De",
                    inputType: "date",
                    default: true,
                    helperText: "Início do período"
                },
                {
                    type: "input",
                    value: "to",
                    label: "Até",
                    inputType: "date",
                    default: true,
                    helperText: "Fim do período"
                },
                {
                    type: "input",
                    value: "q",
                    label: "Conteúdo do log",
                    default: true
                }
            ] as FilterDef[]
        };
    },

    mounted() {
        void this.loadLogs();
    },

    methods: {
        actionLabel(action: string): string {
            return ACTION_LABELS[action] ?? action;
        },

        entityLabel(entity: string): string {
            return ENTITY_LABELS[entity] ?? entity;
        },

        actorLabel(entry: AuditLogEntry): string {
            if (entry.actor.type === "system") {
                return "Sistema";
            }

            return entry.actor.name || entry.actor.email || entry.actor.id;
        },

        formatDateTime(value: string): string {
            const date = new Date(value);

            if (Number.isNaN(date.getTime())) {
                return value;
            }

            return date.toLocaleString("pt-BR");
        },

        formatValue(value: unknown): string {
            if (value === null || value === undefined) {
                return "—";
            }

            if (typeof value === "string") {
                return value;
            }

            return JSON.stringify(value, null, 2);
        },

        onFilters(values: FilterValues) {
            this.filterValues = { ...values };
            this.filtersKey = toQueryString(values) || "all";
            this.page = 1;
            void this.loadLogs();
        },

        onPage(page: number) {
            this.page = page;
            void this.loadLogs();
        },

        async loadLogs() {
            this.loading = true;

            try {
                const params: Record<string, string | number> = {
                    page: this.page,
                    limit: this.pageLimit
                };

                for (const [key, value] of Object.entries(this.filterValues)) {
                    if (value) {
                        params[key] = value;
                    }
                }

                const response = await this.$http.get<ListResponse<AuditLogEntry>>(
                    `/api/audit-logs?${toQueryString(params)}`
                );
                const payload = response.data;
                const rows = payload.data ?? [];

                this.tableRows = rows.map((entry) => ({
                    id: entry.id,
                    occurredAt: this.formatDateTime(entry.occurredAt),
                    actor: this.actorLabel(entry),
                    action: this.actionLabel(entry.action),
                    entity: this.entityLabel(entry.entity),
                    entityId: entry.entityId ?? "—",
                    result: entry.result === "success" ? "Sucesso" : "Falha",
                    _raw: entry
                }));
                this.pageCount = pageCountFromTotal(
                    payload.total ?? 0,
                    this.pageLimit,
                    this.pageLimit
                );
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar os logs.");
                this.tableRows = [];
                this.pageCount = 1;
            } finally {
                this.loading = false;
            }
        },

        onRowAction(value: string, item: Record<string, unknown>) {
            if (value !== "inspect") {
                return;
            }

            const raw = item._raw as AuditLogEntry | undefined;

            if (!raw) {
                return;
            }

            this.selected = raw;
            this.detailView = "simple";
            this.detailOpen = true;
        }
    }
});
</script>
