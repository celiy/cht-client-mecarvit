<template>
    <CrudListPage
        ref="listPage"

        title="Entradas e saídas"
        :show-filters="false"
        :show-create="canCreate"
        :show-export="canExport"
        :exporting="exporting"

        @create="onCreate"
        @close-create="closeDialog"
        @delete="onDelete"
        @export="onExport"
    >
        <template #body>
            <section
                id="entradas"
                class="mt-2 mb-4 scroll-mt-24 border-t border-b pt-2 pb-4"
            >
                <div class="mb-4">
                    <h3 class="mb-1!">Entradas</h3>
                    <p class="text-muted-foreground! sm:w-1/2">
                        Entradas correspondem a todos os valores recebidos pela empresa, seja por
                        vendas, serviços ou outros recebimentos.
                    </p>
                </div>

                <div class="mb-4">
                    <FilterInputs
                        :filters="entradaFilterDefs"
                        :filter-select-options="entradaOsFilterOptions"
                        :loading="loadingEntradas"

                        @filters="onEntradaFilters"
                        @reload="getEntradas"
                        @search:external="onEntradaFilterSearch"
                    />
                </div>

                <Table
                    :headers="tableHeaders"
                    :actions="rowActions"
                    :data="entradaRows"
                    :loading="loadingEntradas"

                    @click:action="onSectionAction"
                >
                    <template #empty>
                        <EmptyTableMessage
                            title="Nenhum lançamento encontrado."
                            description="Ajuste os filtros ou cadastre um novo lançamento."
                        />
                    </template>
                </Table>

                <Pagination
                    id="pagination-entradas"
                    :key="entradaFilters || 'entradas'"

                    class="mt-4"
                    :amount="entradaPageCount"
                    :show-max="5"
                    :use-memo="true"

                    @update:page="onEntradaPage"
                />
            </section>

            <section
                id="saidas"
                class="mt-10 scroll-mt-24"
            >
                <div class="mb-4">
                    <h3 class="mb-1!">Saídas</h3>
                    <p class="text-muted-foreground! sm:w-1/2">
                        Saídas são todos os valores pagos pela empresa, como custos, despesas e
                        outros pagamentos.
                    </p>
                </div>

                <div class="mb-4">
                    <FilterInputs
                        :filters="saidaFilterDefs"
                        :loading="loadingSaidas"

                        @filters="onSaidaFilters"
                        @reload="getSaidas"
                    />
                </div>

                <Table
                    :headers="tableHeaders"
                    :actions="rowActions"
                    :data="saidaRows"
                    :loading="loadingSaidas"

                    @click:action="onSectionAction"
                >
                    <template #empty>
                        <EmptyTableMessage
                            title="Nenhum lançamento encontrado."
                            description="Ajuste os filtros ou cadastre um novo lançamento."
                        />
                    </template>
                </Table>

                <Pagination
                    id="pagination-saidas"
                    :key="saidaFilters || 'saidas'"

                    class="mt-4"
                    :amount="saidaPageCount"
                    :show-max="5"
                    :use-memo="true"

                    @update:page="onSaidaPage"
                />
            </section>
        </template>

        <ItemViewEdit
            ref="itemDialog"

            v-model:is-open="dialogOpen"
            :header="dialogHeader"
            :mode="dialogMode"
            :item="dialogItem"
            :fields="dialogFields"
            :saving="dialogSaving"
            :submit-disabled="paymentModalOpen"
            :form-key="dialogKey"

            @save="onSave"
            @cancel="closeDialog"
            @update:mode="onDialogModeChange"
        >
            <template
                v-if="dialogMode === 'create' || dialogMode === 'edit' || dialogMode === 'view'"
                #belowForm
            >
                <div class="mt-4">
                    <Button
                        type="button"
                        variant="outline"
                        size="small"
                        left-icon="fa-money-bill"
                        :label="dialogPagamentosButtonLabel"

                        @click="openDialogPagamentos"
                    />
                </div>
            </template>

            <template
                v-if="linkedOrdemServicoId && dialogMode === 'view'"
                #actions="{ cancel, toggleMode, showModeToggle, modeToggleLabel }"
            >
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex items-center gap-2">
                        <Button
                            v-if="showModeToggle"

                            type="button"
                            variant="secondary"
                            size="small"
                            :label="modeToggleLabel"

                            @click="toggleMode"
                        />
                    </div>

                    <div class="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="info"
                            type="button"

                            @click="openLinkedOrdemServico"
                        >
                            Ver ordem de serviço
                        </Button>

                        <Button
                            variant="primary"
                            type="button"

                            @click="cancel"
                        >
                            Fechar
                        </Button>
                    </div>
                </div>
            </template>
        </ItemViewEdit>

        <Modal
            :is-open="osDialogOpen"
            size="extra-large"

            @update:value="onOsDialogOpenChange"
        >
            <template #header>
                {{ osDialogHeader }}
            </template>

            <template #body>
                <OrdemServicoForm
                    v-if="osDialogOpen"
                    :key="osDialogKey"

                    :form-id="osFormId"
                    mode="view"
                    :values="osDialogItem"
                    :cliente-options="osClienteOptions"
                    :veiculo-options="osVeiculoSelectOptions"
                    :funcionario-options="osFuncionarioSelectOptions"
                    :pagamentos="osDialogPagamentos"
                />
            </template>

            <template #footer>
                <div class="flex flex-wrap justify-end gap-2">
                    <Button
                        variant="primary"
                        type="button"

                        @click="closeOsDialog"
                    >
                        Fechar
                    </Button>
                </div>
            </template>
        </Modal>

        <PagamentosModal
            v-model:is-open="paymentModalOpen"
            :saving="paymentSaving"
            :valor-total="paymentResumo?.valorTotal ?? undefined"
            :rows="paymentModalRows"
            :readonly="paymentReadonly"

            @save="onSavePagamentosModal"
            @cancel="onPaymentModalCancel"
        />
    </CrudListPage>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { toQueryString } from "@shared/frontend/queryString";
import Button from "@design/components/Button.vue";
import Pagination from "@design/components/custom/Pagination.vue";
import type { FilterDef, FilterValues } from "../../components/FilterInputs.vue";
import FilterInputs from "../../components/FilterInputs.vue";
import EmptyTableMessage from "../../components/EmptyTableMessage.vue";
import ItemViewEdit from "../../components/ItemViewEdit.vue";
import CrudListPage, { type TableHeader } from "../../components/CrudListPage.vue";
import OrdemServicoForm, {
    emptyOrdemServicoFormValues,
    mergeOrdemServicoFormValues,
    type OrdemServicoFormValues,
    type VeiculoSelectOption
} from "../../components/OrdemServicoForm.vue";
import type { OrdemServicoItemFormRow } from "../../components/OrdemServicoItensSection.vue";
import { formatDateBr, formatDateInputValue } from "@shared/format/dateTime";
import { formatTableLabel } from "../../js/formatTableLabel";
import { dateToInputValue, registroFormFields } from "../../js/entityFields";
import PagamentosModal from "../../components/PagamentosModal.vue";
import { moneyAmountToInputDigits, parseMoneyInput } from "@shared/format/moneyInput";
import { sumPagamentosValor, type PagamentoFormRow } from "../../js/pagamentoOptions";
import {
    CRUD_ROW_ACTIONS_WITH_PAGAMENTO,
    documentDigits,
    fetchAllList,
    formatMoneyBrl,
    listQuery,
    notifyHttpError,
    pageCountFromTotal,
    type DialogMode,
    type ItemResponse,
    type ItemViewEditExpose,
    type ListResponse
} from "../../js/crudHttp";
import { currentCanCreate, currentCanDelete, currentCanExport, excludeCurrentUsuario } from "../../js/mecarvit";
import { downloadTablesPdf } from "../../js/exportTablePdf";

interface OrdemServicoLinkApi {
    id: number;
    clienteDocumento?: string;
    veiculoId?: number;
}

interface PagamentoApi {
    id: number;
    tipo: string;
    valor: number;
    criadoEm?: string;
    modificadoEm?: string;
}

interface RegistroApi {
    id: number;
    criadoEm?: string;
    modificadoEm?: string;
    tipo: string;
    nome: string;
    valor: number;
    descricao?: string | null;
    dataLimitePagamento?: string | null;
    ordemServico?: OrdemServicoLinkApi | null;
    pagamentos?: PagamentoApi[];
}

interface ClienteApi {
    documento: string;
    nome: string;
    cel?: string | null;
}

interface VeiculoApi {
    id: number;
    modelo: string;
    placa: string;
    clienteDocumento: string;
    tipo?: string | null;
    kilometragem?: number | null;
}

interface OrdemServicoItemApi {
    servicoId: number;
    servicoNome?: string;
    quantidade: number;
    valor: number;
}

interface OrdemServicoApi {
    id: number;
    criadoEm?: string;
    modificadoEm?: string;
    clienteDocumento: string;
    veiculoId: number;
    statusOsId?: number;
    dataInicio?: string | null;
    dataConclusao?: string | null;
    dataLimitePagamento?: string | null;
    diagnosticoCliente?: string | null;
    diagnosticoMecanico?: string | null;
    obs?: string | null;
    itens?: OrdemServicoItemApi[];
    pagamentos?: PagamentoApi[];
    responsaveis?: string[];
    registroEntradaSaida?: { dataLimitePagamento?: string | null } | null;
}

interface UsuarioApi {
    cpf: string;
    nome: string;
}

function mapOsItensFromApi(itens: OrdemServicoItemApi[] | undefined): OrdemServicoItemFormRow[] {
    return (itens ?? []).map((item) => ({
        servicoId: item.servicoId,
        servicoNome: item.servicoNome ?? "",
        quantidade: String(item.quantidade),
        valor: moneyAmountToInputDigits(item.valor)
    }));
}

interface RegistroFormValues {
    id?: number;
    criadoEm?: string;
    modificadoEm?: string;
    tipo: string;
    nome: string;
    valor: string;
    valorPago?: string;
    descricao: string;
    dataLimitePagamento: string;
}

type CrudListPageExpose = {
    requestDelete: (item: Record<string, unknown>) => void;
};

function emptyRegistroForm(tipo = ""): RegistroFormValues {
    return {
        tipo,
        nome: "",
        valor: "",
        descricao: "",
        dataLimitePagamento: ""
    };
}

function toRegistroForm(registro: RegistroApi): RegistroFormValues {
    return {
        id: registro.id,
        criadoEm: registro.criadoEm ?? "",
        modificadoEm: registro.modificadoEm ?? "",
        tipo: registro.tipo ?? "",
        nome: registro.nome ?? "",
        valor: registro.valor == null ? "" : moneyAmountToInputDigits(Number(registro.valor)),
        valorPago: formatMoneyBrl(sumPagamentosValor(registro.pagamentos)),
        descricao: registro.descricao ?? "",
        dataLimitePagamento: dateToInputValue(registro.dataLimitePagamento)
    };
}

function toOsForm(
    os: OrdemServicoApi,
    cliente?: ClienteApi,
    veiculo?: VeiculoApi
): OrdemServicoFormValues {
    return {
        ...emptyOrdemServicoFormValues({
            defaultStatusId: os.statusOsId != null ? String(os.statusOsId) : "1"
        }),
        id: os.id,
        criadoEm: os.criadoEm ?? "",
        modificadoEm: os.modificadoEm ?? "",
        clienteDocumento: os.clienteDocumento ?? "",
        clienteNome: cliente?.nome ?? "",
        clienteCel: cliente?.cel != null ? String(cliente.cel) : "",
        veiculoId: os.veiculoId != null ? String(os.veiculoId) : "",
        veiculoModelo: veiculo?.modelo ?? "",
        veiculoPlaca: veiculo?.placa ?? "",
        veiculoKilometragem:
            veiculo?.kilometragem != null && veiculo.kilometragem !== 0
                ? String(veiculo.kilometragem)
                : "",
        veiculoTipo: veiculo?.tipo ?? "",
        dataInicio: formatDateInputValue(os.dataInicio),
        dataConclusao: formatDateInputValue(os.dataConclusao),
        dataLimitePagamento: dateToInputValue(
            os.registroEntradaSaida
                ? os.registroEntradaSaida.dataLimitePagamento
                : os.dataLimitePagamento
        ),
        diagnosticoCliente: os.diagnosticoCliente ?? "",
        diagnosticoMecanico: os.diagnosticoMecanico ?? "",
        obs: os.obs ?? "",
        responsaveisCpfs: (os.responsaveis ?? []).map((cpf) => String(cpf).trim()).filter(Boolean),
        itens: mapOsItensFromApi(os.itens)
    };
}

function tipoLabel(tipo: string): string {
    if (tipo === "entrada") {
        return "Entrada";
    }

    if (tipo === "saida") {
        return "Saída";
    }

    return formatTableLabel(tipo);
}

export default defineComponent({
    name: "MecarvitEntradasSaidasPage",

    components: {
        Button,
        CrudListPage,
        EmptyTableMessage,
        FilterInputs,
        ItemViewEdit,
        OrdemServicoForm,
        PagamentosModal,
        Pagination
    },

    data() {
        return {
            entradaOsFilterOptions: {
                ordemServicoId: [] as Array<{ label: string; value: string }>
            },
            osFilterSearchSeq: 0,
            tableHeaders: [
                { label: "Nome", field: "nome", position: "start" },
                { label: "Valor", field: "valorLabel", position: "end" },
                { label: "Pago", field: "pagoLabel", position: "end" },
                { label: "Data limite", field: "dataLimiteLabel", position: "end" }
            ] as TableHeader[],
            entradas: [] as RegistroApi[],
            saidas: [] as RegistroApi[],
            loadingEntradas: false,
            loadingSaidas: false,
            entradaFilters: "",
            saidaFilters: "",
            entradaPage: 1,
            saidaPage: 1,
            pageLimit: 10,
            entradaPageCount: 0,
            saidaPageCount: 0,
            dialogOpen: false,
            dialogSaving: false,
            dialogMode: "view" as DialogMode,
            dialogItem: emptyRegistroForm() as RegistroFormValues,
            dialogOriginalItem: emptyRegistroForm() as RegistroFormValues,
            dialogKey: 0,
            linkedOrdemServicoId: null as number | null,
            lockValorFromOs: false,
            lockTipoFromOs: false,
            osDialogOpen: false,
            osDialogKey: 0,
            osFormId: "entrada-saida-os-form",
            osDialogItem: emptyOrdemServicoFormValues(),
            osDialogPagamentos: [] as PagamentoFormRow[],
            osClientes: [] as ClienteApi[],
            osVeiculos: [] as VeiculoApi[],
            osFuncionarios: [] as UsuarioApi[],
            dialogPagamentos: [] as PagamentoFormRow[],
            paymentModalOpen: false,
            paymentSaving: false,
            paymentModalRows: [] as PagamentoFormRow[],
            paymentReadonly: false,
            paymentTarget: null as {
                registroId: number;
                ordemServicoId: number | null;
                valorTotal: number;
            } | null,
            scrollFrame: null as number | null,
            exporting: false
        };
    },

    computed: {
        canCreate(): boolean {
            return currentCanCreate("financeiro");
        },

        canExport(): boolean {
            return currentCanExport("financeiro");
        },

        rowActions() {
            if (currentCanDelete("financeiro")) {
                return CRUD_ROW_ACTIONS_WITH_PAGAMENTO;
            }

            return CRUD_ROW_ACTIONS_WITH_PAGAMENTO.filter(
                (action) => action.value !== "delete" && !action.separator
            );
        },

        pagoFilterDef(): FilterDef {
            return {
                type: "option",
                value: "pago",
                label: "Pago",
                options: [
                    { label: "Todos", value: "todos", default: true },
                    { label: "Sim", value: "sim" },
                    { label: "Não", value: "nao" }
                ]
            };
        },

        dataLimiteFilterDef(): FilterDef {
            return {
                type: "input",
                value: "dataLimitePagamento",
                label: "Data limite",
                inputType: "date"
            };
        },

        entradaFilterDefs(): FilterDef[] {
            return [
                { type: "input", value: "nome", label: "Nome", default: true },
                this.dataLimiteFilterDef,
                {
                    type: "select",
                    value: "ordemServicoId",
                    label: "Ordem de serviço",
                    multiple: true,
                    search: {
                        external: true,
                        field: "id"
                    }
                },
                this.pagoFilterDef
            ];
        },

        saidaFilterDefs(): FilterDef[] {
            return [
                { type: "input", value: "nome", label: "Nome", default: true },
                this.dataLimiteFilterDef,
                this.pagoFilterDef
            ];
        },
        entradaRows() {
            return this.entradas.map((row) => this.toTableRow(row));
        },

        saidaRows() {
            return this.saidas.map((row) => this.toTableRow(row));
        },

        paymentResumo(): { valorTotal: number } | null {
            const target = this.paymentTarget;

            if (!target) {
                return null;
            }

            return {
                valorTotal: target.valorTotal
            };
        },

        dialogHeader(): string {
            if (this.dialogMode === "create") {
                return "Novo lançamento";
            }

            return this.dialogItem.nome || "Lançamento";
        },

        dialogPagamentosButtonLabel(): string {
            if (this.dialogMode === "create") {
                return "Registrar pagamentos";
            }

            return "Gerenciar pagamentos";
        },

        dialogFields() {
            return registroFormFields({
                lockValorFromOs: this.lockValorFromOs,
                lockTipoFromOs: this.lockTipoFromOs,
                showValorPago: this.dialogMode !== "create"
            });
        },

        osDialogHeader(): string {
            if (this.osDialogItem.id) {
                return `OS #${this.osDialogItem.id}`;
            }

            return "Ordem de serviço";
        },

        osClienteOptions() {
            return this.osClientes.map((cliente) => ({
                label: `${cliente.nome} · ${cliente.documento}`,
                value: cliente.documento
            }));
        },

        osVeiculoSelectOptions(): VeiculoSelectOption[] {
            return this.osVeiculos.map((veiculo) => ({
                label: `${veiculo.modelo} · ${veiculo.placa}`,
                value: String(veiculo.id),
                clienteDocumento: veiculo.clienteDocumento,
                modelo: veiculo.modelo,
                placa: veiculo.placa,
                kilometragem:
                    veiculo.kilometragem != null && veiculo.kilometragem !== 0
                        ? String(veiculo.kilometragem)
                        : "",
                tipo: veiculo.tipo ?? ""
            }));
        },

        osFuncionarioSelectOptions() {
            return this.osFuncionarios.map((usuario) => ({
                label: usuario.nome,
                value: documentDigits(usuario.cpf)
            }));
        }
    },

    watch: {
        "$route.hash": {
            immediate: true,
            handler() {
                this.scrollToHash();
            }
        }
    },

    beforeUnmount() {
        this.clearScrollFrame();
    },

    methods: {
        listPage(): CrudListPageExpose | undefined {
            return this.$refs.listPage as CrudListPageExpose | undefined;
        },

        itemDialog(): ItemViewEditExpose | undefined {
            return this.$refs.itemDialog as ItemViewEditExpose | undefined;
        },

        pagamentosValorFromApi(pagamentos: PagamentoApi[] | undefined): number {
            return sumPagamentosValor(pagamentos);
        },

        pagamentosValorFromFormRows(rows: PagamentoFormRow[]): number {
            return sumPagamentosValor(rows);
        },

        currentDialogItemValues(): RegistroFormValues {
            const next = { ...this.dialogItem };

            for (const fieldId of [
                "id",
                "criadoEm",
                "modificadoEm",
                "tipo",
                "nome",
                "valor",
                "valorPago",
                "descricao",
                "dataLimitePagamento"
            ]) {
                const value = this.itemDialog()?.getFieldValue(fieldId);

                if (value !== undefined) {
                    next[fieldId as keyof RegistroFormValues] = value as never;
                }
            }

            return next;
        },

        syncDialogValorPago() {
            const label = formatMoneyBrl(this.pagamentosValorFromFormRows(this.dialogPagamentos));
            const nextItem = this.currentDialogItemValues();

            nextItem.valorPago = label;
            this.dialogItem = nextItem;
            this.itemDialog()?.setFieldValue("valorPago", label);
        },

        buildPaymentTarget(registroId: number, ordemServicoId: number | null, valorTotal: number) {
            return {
                registroId,
                ordemServicoId,
                valorTotal
            };
        },

        onPaymentModalCancel() {
            this.paymentModalOpen = false;
            this.paymentTarget = null;
            this.paymentModalRows = [];
        },

        toTableRow(row: RegistroApi) {
            return {
                ...row,
                tipoLabel: tipoLabel(row.tipo),
                valorLabel: formatMoneyBrl(row.valor),
                pagoLabel: formatMoneyBrl(this.pagamentosValorFromApi(row.pagamentos)),
                dataLimiteLabel: formatDateBr(row.dataLimitePagamento)
            };
        },

        clearScrollFrame() {
            if (this.scrollFrame == null) {
                return;
            }

            window.cancelAnimationFrame(this.scrollFrame);
            this.scrollFrame = null;
        },

        scrollToHash() {
            const id = this.$route.hash.replace(/^#/, "");

            if (id !== "entradas" && id !== "saidas") {
                return;
            }

            this.clearScrollFrame();
            this.scrollFrame = window.requestAnimationFrame(() => {
                this.scrollFrame = null;
                document.getElementById(id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            });
        },

        closeDialog() {
            this.dialogOpen = false;
            this.dialogSaving = false;
            this.linkedOrdemServicoId = null;
            this.lockValorFromOs = false;
            this.lockTipoFromOs = false;
            this.dialogPagamentos = [];
            void this.$refs.listPage?.clearCadastrarQuery?.();
        },

        onDialogModeChange(mode: DialogMode) {
            if (this.dialogMode === "view" && mode === "edit") {
                this.dialogOriginalItem = JSON.parse(JSON.stringify(this.dialogItem));
            }

            if (this.dialogMode === "edit" && mode === "view") {
                this.dialogItem = JSON.parse(JSON.stringify(this.dialogOriginalItem));
                this.dialogKey += 1;
            }

            this.dialogMode = mode;
        },

        mapPagamentosFromApi(pagamentos: PagamentoApi[] | undefined): PagamentoFormRow[] {
            return (pagamentos ?? []).map((row) => ({
                id: row.id,
                tipo: row.tipo,
                valor: String(row.valor),
                criadoEm: row.criadoEm,
                modificadoEm: row.modificadoEm
            }));
        },

        pagamentosPayload(): Array<{ tipo: string; valor: number }> {
            return this.dialogPagamentos.map((row) => ({
                tipo: row.tipo,
                valor: Number(row.valor)
            }));
        },

        openDialogPagamentos() {
            const registroId = Number(this.dialogItem.id);
            const valorTotal = parseMoneyInput(this.dialogItem.valor) ?? 0;

            this.paymentReadonly = false;
            this.paymentModalRows = [...this.dialogPagamentos];
            this.paymentTarget = this.buildPaymentTarget(
                Number.isInteger(registroId) && registroId > 0 ? registroId : 0,
                this.linkedOrdemServicoId,
                Number.isFinite(valorTotal) ? valorTotal : 0
            );
            this.paymentModalOpen = true;
        },

        async onEntradaFilterSearch(payload: { filterKey: string; field: string; value: string }) {
            if (payload.filterKey !== "ordemServicoId") {
                return;
            }

            this.osFilterSearchSeq += 1;
            const seq = this.osFilterSearchSeq;
            const trimmed = payload.value.trim();
            const query = toQueryString({
                limit: 25,
                ...(trimmed ? { [payload.field || "id"]: trimmed } : {})
            });

            try {
                const response = await this.$http.get<ListResponse<{ id: number }>>(
                    `/api/ordem-servico?${query}`
                );

                if (seq !== this.osFilterSearchSeq) {
                    return;
                }

                this.entradaOsFilterOptions = {
                    ordemServicoId: (response.data.data ?? []).map((os) => ({
                        label: `OS #${os.id}`,
                        value: String(os.id)
                    }))
                };
            } catch {
                if (seq !== this.osFilterSearchSeq) {
                    return;
                }

                this.entradaOsFilterOptions = { ordemServicoId: [] };
            }
        },

        openQuickPagamento(row: Record<string, unknown>) {
            const registroId = Number(row.id);
            const ordemServicoId = row.ordemServico
                ? Number((row.ordemServico as OrdemServicoLinkApi).id)
                : null;

            if (!Number.isInteger(registroId) || registroId <= 0) {
                return;
            }

            const registro = row as RegistroApi;
            const valorTotal = Number(registro.valor);

            this.paymentReadonly = false;
            this.paymentModalRows = this.mapPagamentosFromApi(registro.pagamentos);
            this.paymentTarget = this.buildPaymentTarget(
                registroId,
                Number.isInteger(ordemServicoId) && ordemServicoId! > 0 ? ordemServicoId : null,
                Number.isFinite(valorTotal) ? valorTotal : 0
            );
            this.paymentModalOpen = true;
        },

        mapPagamentosToFormRows(
            pagamentos: Array<{
                id?: number;
                tipo: string;
                valor: number;
                criadoEm?: string;
                modificadoEm?: string;
            }>
        ): PagamentoFormRow[] {
            return pagamentos.map((row) => ({
                id: row.id,
                tipo: row.tipo,
                valor: String(row.valor),
                criadoEm: row.criadoEm,
                modificadoEm: row.modificadoEm
            }));
        },

        async onSavePagamentosModal(
            pagamentos: Array<{ id?: number; tipo: string; valor: number }>
        ) {
            const target = this.paymentTarget;

            if (!target) {
                return;
            }

            const registroId = target.registroId;

            if (!Number.isInteger(registroId) || registroId <= 0) {
                this.dialogPagamentos = this.mapPagamentosToFormRows(pagamentos);
                this.syncDialogValorPago();
                this.onPaymentModalCancel();
                this.$toast.success(
                    "Pagamentos adicionados ao lançamento. Salve o lançamento quando terminar."
                );

                return;
            }

            this.paymentSaving = true;

            try {
                if (target.ordemServicoId) {
                    await this.$http.put(`/api/ordem-servico/${target.ordemServicoId}`, {
                        pagamentos
                    });
                } else {
                    await this.$http.put(`/api/regentradasaida/${target.registroId}`, {
                        pagamentos
                    });
                }

                this.$toast.success("Pagamentos salvos.");
                this.onPaymentModalCancel();

                if (this.dialogOpen && Number(this.dialogItem.id) === target.registroId) {
                    const response = await this.$http.get<ItemResponse<RegistroApi>>(
                        `/api/regentradasaida/${target.registroId}`
                    );
                    const registro = response.data.data;

                    this.dialogPagamentos = this.mapPagamentosFromApi(registro.pagamentos);
                    this.applyRegistroLocks(registro);
                    this.syncDialogValorPago();
                }

                await Promise.all([this.getEntradas(), this.getSaidas()]);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível salvar os pagamentos.");
            } finally {
                this.paymentSaving = false;
            }
        },

        closeOsDialog() {
            this.osDialogOpen = false;
            this.osDialogPagamentos = [];
            this.osDialogItem = emptyOrdemServicoFormValues();
            this.osFuncionarios = [];
        },

        onOsDialogOpenChange(open: boolean) {
            this.osDialogOpen = open;

            if (!open) {
                this.osDialogPagamentos = [];
                this.osDialogItem = emptyOrdemServicoFormValues();
                this.osFuncionarios = [];
            }
        },

        async loadOsFuncionarios(
            base: UsuarioApi[],
            responsaveisCpfs: string[]
        ): Promise<UsuarioApi[]> {
            const byCpf = new Map<string, UsuarioApi>();

            for (const usuario of base) {
                const cpf = usuario.cpf.replace(/\D/g, "");

                if (cpf) {
                    byCpf.set(cpf, usuario);
                }
            }

            for (const rawCpf of responsaveisCpfs) {
                const cpf = rawCpf.replace(/\D/g, "");

                if (!cpf || byCpf.has(cpf)) {
                    continue;
                }

                try {
                    const response = await this.$http.get<ItemResponse<UsuarioApi>>(
                        `/api/usuario/${cpf}`
                    );
                    const usuario = response.data.data;

                    if (usuario?.cpf) {
                        byCpf.set(cpf, usuario);
                    }
                } catch {
                    // Mantém só o CPF na visualização.
                }
            }

            return [...byCpf.values()];
        },

        applyRegistroLocks(registro: RegistroApi) {
            const fromOs = Boolean(registro.ordemServico?.id);
            const isEntrada = registro.tipo?.trim().toLowerCase() === "entrada";

            this.linkedOrdemServicoId =
                fromOs && isEntrada ? (registro.ordemServico?.id ?? null) : null;
            this.lockValorFromOs = Boolean(this.linkedOrdemServicoId);
            this.lockTipoFromOs = Boolean(this.linkedOrdemServicoId);
        },

        async openLinkedOrdemServico() {
            const id = this.linkedOrdemServicoId;

            if (!id) {
                return;
            }

            try {
                const [osResponse, clientes, veiculos, usuarios] = await Promise.all([
                    this.$http.get<ItemResponse<OrdemServicoApi>>(`/api/ordem-servico/${id}`),
                    this.$http.get<ListResponse<ClienteApi>>(
                        "/api/cliente?limit=100&ativo=ativo,inativo"
                    ),
                    this.$http.get<ListResponse<VeiculoApi>>(
                        "/api/veiculo?limit=100&ativo=ativo,inativo"
                    ),
                    this.$http.get<ListResponse<UsuarioApi>>(
                        "/api/usuario?limit=100&ativo=ativo,inativo"
                    )
                ]);

                const os = osResponse.data.data;

                this.osClientes = clientes.data.data ?? [];
                this.osVeiculos = veiculos.data.data ?? [];
                this.osFuncionarios = await this.loadOsFuncionarios(
                    excludeCurrentUsuario(usuarios.data.data ?? []),
                    os.responsaveis ?? []
                );
                const cliente = this.osClientes.find(
                    (entry) => entry.documento === os.clienteDocumento
                );
                const veiculo = this.osVeiculos.find((entry) => entry.id === os.veiculoId);

                this.osDialogKey += 1;
                this.osDialogItem = mergeOrdemServicoFormValues(toOsForm(os, cliente, veiculo));
                this.osDialogPagamentos = this.mapPagamentosFromApi(os.pagamentos);
                this.osDialogOpen = true;
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível carregar a ordem de serviço."
                );
            }
        },

        defaultTipoFromHash(): string {
            if (this.$route.hash === "#saidas") {
                return "saida";
            }

            if (this.$route.hash === "#entradas") {
                return "entrada";
            }

            return "";
        },

        registroFiltersQuery(values: FilterValues): string {
            const queryValues = { ...values };

            if (queryValues.pago === "todos") {
                delete queryValues.pago;
            }

            return toQueryString(queryValues);
        },

        onEntradaFilters(values: FilterValues) {
            this.entradaPage = 1;
            this.entradaFilters = this.registroFiltersQuery(values);
            void this.getEntradas();
        },

        onSaidaFilters(values: FilterValues) {
            this.saidaPage = 1;
            this.saidaFilters = this.registroFiltersQuery(values);
            void this.getSaidas();
        },

        onEntradaPage(page: number) {
            if (page === this.entradaPage) {
                return;
            }

            this.entradaPage = page;
            void this.getEntradas();
        },

        onSaidaPage(page: number) {
            if (page === this.saidaPage) {
                return;
            }

            this.saidaPage = page;
            void this.getSaidas();
        },

        async getEntradas() {
            await this.getRegistros("entrada");
        },

        async getSaidas() {
            await this.getRegistros("saida");
        },

        async onExport() {
            this.exporting = true;

            try {
                const [entradas, saidas] = await Promise.all([
                    fetchAllList<RegistroApi>(
                        this.$http.get.bind(this.$http),
                        "/api/regentradasaida",
                        [this.entradaFilters, toQueryString({ tipo: "entrada" })]
                            .filter(Boolean)
                            .join("&")
                    ),
                    fetchAllList<RegistroApi>(
                        this.$http.get.bind(this.$http),
                        "/api/regentradasaida",
                        [this.saidaFilters, toQueryString({ tipo: "saida" })]
                            .filter(Boolean)
                            .join("&")
                    )
                ]);

                downloadTablesPdf("Entradas e saídas", [
                    {
                        title: "Entradas",
                        headers: this.tableHeaders,
                        rows: entradas.map((row) => this.toTableRow(row))
                    },
                    {
                        title: "Saídas",
                        headers: this.tableHeaders,
                        rows: saidas.map((row) => this.toTableRow(row))
                    }
                ]);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível exportar a tabela.");
            } finally {
                this.exporting = false;
            }
        },

        async getRegistros(tipo: "entrada" | "saida") {
            const isEntrada = tipo === "entrada";
            const filters = isEntrada ? this.entradaFilters : this.saidaFilters;
            const page = isEntrada ? this.entradaPage : this.saidaPage;
            const tipoQuery = toQueryString({ tipo });
            const query = listQuery(
                [filters, tipoQuery].filter(Boolean).join("&"),
                page,
                this.pageLimit
            );

            try {
                if (isEntrada) {
                    this.loadingEntradas = true;
                } else {
                    this.loadingSaidas = true;
                }

                const response = await this.$http.get<ListResponse<RegistroApi>>(
                    `/api/regentradasaida?${query}`
                );
                const rows = response.data.data ?? [];
                const count = pageCountFromTotal(
                    response.data.total,
                    response.data.limit,
                    this.pageLimit
                );

                if (isEntrada) {
                    this.entradas = rows;
                    this.entradaPageCount = count;
                } else {
                    this.saidas = rows;
                    this.saidaPageCount = count;
                }
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    isEntrada
                        ? "Não foi possível carregar as entradas."
                        : "Não foi possível carregar as saídas."
                );

                if (isEntrada) {
                    this.entradas = [];
                    this.entradaPageCount = 0;
                } else {
                    this.saidas = [];
                    this.saidaPageCount = 0;
                }
            } finally {
                if (isEntrada) {
                    this.loadingEntradas = false;
                } else {
                    this.loadingSaidas = false;
                }
            }
        },

        openDialog(mode: DialogMode, item: RegistroFormValues) {
            this.dialogKey += 1;
            this.dialogMode = mode;
            this.dialogItem = item;
            this.dialogOriginalItem = JSON.parse(JSON.stringify(item));
            this.dialogSaving = false;
            this.dialogOpen = true;
        },

        onCreate() {
            this.openDialog("create", emptyRegistroForm(this.defaultTipoFromHash()));
        },

        async openRegistroDialog(mode: "view" | "edit", row: Record<string, unknown>) {
            const id = Number(row.id);

            if (!Number.isInteger(id) || id <= 0) {
                this.$toast.error("Lançamento inválido.");
                return;
            }

            try {
                const response = await this.$http.get<ItemResponse<RegistroApi>>(
                    `/api/regentradasaida/${id}`
                );
                const registro = response.data.data;

                this.applyRegistroLocks(registro);
                this.dialogPagamentos = this.mapPagamentosFromApi(registro.pagamentos);
                this.openDialog(mode, toRegistroForm(registro));
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível carregar o lançamento.");
            }
        },

        onSectionAction(value: string, item: Record<string, unknown>) {
            if (value === "delete") {
                this.listPage()?.requestDelete(item);
                return;
            }

            if (value === "inspect") {
                void this.openRegistroDialog("view", item);
            } else if (value === "edit") {
                void this.openRegistroDialog("edit", item);
            } else if (value === "pagamentos") {
                this.openQuickPagamento(item);
            }
        },

        async onDelete(item: Record<string, unknown>) {
            const id = Number(item.id);

            if (!Number.isInteger(id) || id <= 0) {
                this.$toast.error("Lançamento inválido.");
                return;
            }

            try {
                await this.$http.delete(`/api/regentradasaida/${id}`);
                this.$toast.success("Lançamento excluído.");
                await Promise.all([this.getEntradas(), this.getSaidas()]);
            } catch (error) {
                notifyHttpError(this.$toast, error, "Não foi possível excluir o lançamento.");
            }
        },

        async onSave(payload: Record<string, unknown>) {
            this.dialogSaving = true;

            try {
                const body: Record<string, unknown> = {
                    tipo: payload.tipo,
                    nome: payload.nome,
                    descricao: payload.descricao || undefined,
                    dataLimitePagamento: payload.dataLimitePagamento || null
                };

                if (this.dialogMode === "create" || !this.lockValorFromOs) {
                    const valor = parseMoneyInput(payload.valor);

                    if (valor === null || valor <= 0) {
                        this.$toast.error("Informe um valor maior que zero.");
                        this.dialogSaving = false;

                        return;
                    }

                    body.valor = valor;
                }

                if (!this.linkedOrdemServicoId && this.dialogPagamentos.length > 0) {
                    body.pagamentos = this.pagamentosPayload();
                }

                if (this.dialogMode === "create") {
                    await this.$http.post("/api/regentradasaida", body);
                    this.$toast.success("Lançamento criado.");
                } else {
                    const id = Number(this.dialogItem.id);

                    await this.$http.put(`/api/regentradasaida/${id}`, body);
                    this.$toast.success("Lançamento atualizado.");
                }

                this.closeDialog();
                await Promise.all([this.getEntradas(), this.getSaidas()]);
            } catch (error) {
                notifyHttpError(
                    this.$toast,
                    error,
                    "Não foi possível salvar o lançamento.",
                    this.itemDialog()
                );
            } finally {
                this.dialogSaving = false;
            }
        }
    }
});
</script>
