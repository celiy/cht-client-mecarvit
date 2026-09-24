<template>
    <Modal
        :is-open="isOpen"
        :size="size"

        @update:value="onOpenChange"
    >
        <template #header>
            {{ header }}
        </template>

        <template #body>
            <FormRenderer
                :key="formKey"
                ref="formRenderer"

                :form-id="formId"
                :fields="fields"
                :sections="sections"
                :values="item"
                :readonly="isView"
                :section-columns="sectionColumns"
                :submit-disabled="submitDisabled"

                @submit="onFormSubmit"
                @click:select-action="onSelectAction"
                @click:select-option="onSelectOption"
                @click:select-remove="onSelectRemove"
                @search:external="onSearchExternal"
                @update:field="$emit('update:field', $event)"
            >
                <template
                    v-if="$slots['select-inside-empty-panel']"
                    #select-inside-empty-panel="slotProps"
                >
                    <slot
                        name="select-inside-empty-panel"
                        v-bind="slotProps"
                    />
                </template>

                <template
                    v-if="$slots.formActions"
                    #actions
                >
                    <slot
                        name="formActions"
                        :save="requestSave"
                        :cancel="cancel"
                        :is-view="isView"
                    />
                </template>
            </FormRenderer>

            <slot
                name="aboveCriadoModificado"
                :is-view="isView"
            />

            <CriadoModificadoFields
                v-if="isView"

                class="mt-4"
                :id-prefix="formId"
                :criado-em="auditTimestamp(item.criadoEm)"
                :modificado-em="auditTimestamp(item.modificadoEm)"
            />

            <slot
                name="belowForm"
                :is-view="isView"
            />
        </template>

        <template #footer>
            <slot
                name="actions"
                :save="requestSave"
                :cancel="cancel"
                :is-view="isView"
                :toggle-mode="toggleMode"
                :show-mode-toggle="showModeToggle"
                :mode-toggle-label="modeToggleLabel"
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
                        <template v-if="isView">
                            <Button
                                variant="primary"
                                type="button"

                                @click="cancel"
                            >
                                Fechar
                            </Button>
                        </template>

                        <template v-else>
                            <Button
                                variant="primary"
                                type="submit"
                                :form="formId"
                                :disabled="saving || submitDisabled"
                            >
                                Salvar
                            </Button>

                            <Button
                                variant="secondary"
                                type="button"
                                :disabled="saving || submitDisabled"

                                @click="cancel"
                            >
                                Cancelar
                            </Button>
                        </template>
                    </div>
                </div>
            </slot>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FormRenderer from "@design/components/form/FormRenderer.vue";
import type { FormField } from "@shared/interfaces/FormField";
import CriadoModificadoFields from "./CriadoModificadoFields.vue";

type ItemMode = "view" | "edit" | "create";

type FormRendererExpose = {
    submitForm: () => void;
    applyFieldErrors: (errors: Record<string, string>) => void;
    setFieldValue: (fieldId: string, value: unknown) => void;
    getFieldValue: (fieldId: string) => unknown;
    closeSelect: (fieldId: string) => void;
};

interface FormSection {
    key?: string;
    title: string;
    fields: FormField[];
}

export default defineComponent({
    name: "ItemViewEdit",

    components: {
        CriadoModificadoFields,
        FormRenderer
    },

    props: {
        isOpen: {
            type: Boolean,
            required: true
        },

        header: {
            type: String,
            default: ""
        },

        /**
         * view: display inputs. edit/create: editable form.
         */
        mode: {
            type: String as PropType<ItemMode>,
            default: "view"
        },

        item: {
            type: Object as PropType<Record<string, unknown>>,
            required: false,
            default: () => ({})
        },

        fields: {
            type: Array as PropType<FormField[]>,
            required: false,
            default: () => []
        },

        sections: {
            type: Array as PropType<FormSection[]>,
            required: false,
            default: () => []
        },

        saving: {
            type: Boolean,
            default: false
        },

        submitDisabled: {
            type: Boolean,
            default: false
        },

        size: {
            type: String as PropType<"small" | "medium" | "large">,
            default: "medium"
        },

        sectionColumns: {
            type: [Number, Object] as PropType<
                number | { xs?: number; sm?: number; md?: number; lg?: number }
            >,
            default: 1
        },

        formKey: {
            type: [String, Number],
            default: 0
        },

        hideModeToggle: {
            type: Boolean,
            default: false
        }
    },

    emits: [
        "save",
        "cancel",
        "update:isOpen",
        "update:mode",
        "click:select-action",
        "click:select-option",
        "click:select-remove",
        "search:external",
        "update:field"
    ],

    computed: {
        isView(): boolean {
            return this.mode === "view";
        },

        showModeToggle(): boolean {
            if (this.hideModeToggle) {
                return false;
            }

            return this.mode === "view" || this.mode === "edit";
        },

        modeToggleLabel(): string {
            return this.mode === "view" ? "Editar" : "Visualizar";
        },

        formId(): string {
            return `item-view-edit-${this.$.uid}`;
        }
    },

    methods: {
        auditTimestamp(value: unknown): string | number | Date | undefined {
            if (value == null || value === "") {
                return undefined;
            }

            if (typeof value === "string" || typeof value === "number" || value instanceof Date) {
                return value;
            }

            return String(value);
        },

        formRendererInstance(): FormRendererExpose | undefined {
            return this.$refs.formRenderer as FormRendererExpose | undefined;
        },

        applyFieldErrors(errors: Record<string, string>) {
            this.formRendererInstance()?.applyFieldErrors(errors);
        },

        setFieldValue(fieldId: string, value: unknown) {
            this.formRendererInstance()?.setFieldValue(fieldId, value);
        },

        getFieldValue(fieldId: string): unknown {
            return this.formRendererInstance()?.getFieldValue(fieldId);
        },

        closeSelect(fieldId: string) {
            this.formRendererInstance()?.closeSelect(fieldId);
        },

        onSelectAction(payload: { id: string; field: FormField }) {
            this.$emit("click:select-action", payload);
        },

        onSelectOption(payload: { id: string; value: string; field: FormField }) {
            this.$emit("click:select-option", payload);
        },

        onSelectRemove(payload: { id: string; value: string; field: FormField }) {
            this.$emit("click:select-remove", payload);
        },

        onSearchExternal(payload: { id: string; field: string; value: string }) {
            this.$emit("search:external", payload);
        },

        onFormSubmit(values: Record<string, unknown>) {
            if (this.submitDisabled) {
                return;
            }

            this.$emit("save", values);
        },

        toggleMode() {
            if (this.mode === "view") {
                this.$emit("update:mode", "edit");
                return;
            }

            if (this.mode === "edit") {
                this.$emit("update:mode", "view");
            }
        },

        requestSave() {
            if (this.submitDisabled) {
                return;
            }

            this.formRendererInstance()?.submitForm();
        },

        cancel(event?: Event) {
            event?.stopImmediatePropagation();
            this.$emit("update:isOpen", false);
            this.$emit("cancel");
        },

        onOpenChange(open: boolean) {
            this.$emit("update:isOpen", open);

            if (!open) {
                this.$emit("cancel");
            }
        }
    }
});
</script>
