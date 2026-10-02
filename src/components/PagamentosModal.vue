<template>
    <Modal
        :is-open="isOpen"
        size="small"

        @update:value="onOpenChange"
    >
        <template #header> Pagamentos </template>

        <template #body>
            <PagamentosEditor
                ref="editor"

                :saving="saving"
                :valor-total="valorTotal"
                :rows="rows"
                :readonly="readonly"

                @update:rows="onEditorRows"
            />
        </template>

        <template #footer>
            <div class="flex flex-wrap justify-end gap-2">
                <Button
                    v-if="!readonly"

                    variant="primary"
                    type="button"
                    :disabled="saving"
                    label="Salvar"

                    @click.stop.prevent="onConfirm"
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
                    label="Cancelar"

                    @click.stop.prevent="onCancel"
                />
            </div>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Modal from "@design/components/Modal.vue";
import PagamentosEditor from "./PagamentosEditor.vue";
import type { PagamentoFormRow } from "../js/pagamentoOptions";

type PagamentosEditorExpose = {
    pagamentosPayload: () => Array<{ id?: number; tipo: string; valor: number }>;
};

export default defineComponent({
    name: "PagamentosModal",

    components: {
        Button,
        Modal,
        PagamentosEditor
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
            draftRows: [] as PagamentoFormRow[]
        };
    },

    watch: {
        isOpen(open: boolean) {
            if (open) {
                this.draftRows = [...this.rows];
            }
        }
    },

    methods: {
        editor(): PagamentosEditorExpose | undefined {
            return this.$refs.editor as PagamentosEditorExpose | undefined;
        },

        onEditorRows(rows: PagamentoFormRow[]) {
            this.draftRows = rows;
        },

        onConfirm() {
            const payload = this.editor()?.pagamentosPayload() ?? [];

            this.$emit("save", payload);
        },

        onOpenChange(open: boolean) {
            this.$emit("update:isOpen", open);

            if (!open) {
                this.$emit("cancel");
            }
        },

        onCancel() {
            this.$emit("update:isOpen", false);
            this.$emit("cancel");
        }
    }
});
</script>
