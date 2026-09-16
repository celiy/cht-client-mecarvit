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
            >
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
            >
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
            </slot>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import FormRenderer from "@design/components/form/FormRenderer.vue";
import type { FormField } from "@shared/interfaces/FormField";

type ItemMode = "view" | "edit" | "create";

        type FormRendererExpose = {
            submitForm: () => void;
            applyFieldErrors: (errors: Record<string, string>) => void;
            setFieldValue: (fieldId: string, value: unknown) => void;
            getFieldValue: (fieldId: string) => unknown;
        };

interface FormSection {
    key?: string;
    title: string;
    fields: FormField[];
}

export default defineComponent({
    name: "ItemViewEdit",

    components: {
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
        }
    },

    emits: [
        "save",
        "cancel",
        "update:isOpen",
        "click:select-action",
        "click:select-option",
        "click:select-remove",
        "search:external"
    ],

    computed: {
        isView(): boolean {
            return this.mode === "view";
        },

        formId(): string {
            return `item-view-edit-${this.$.uid}`;
        }
    },

    methods: {
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
        }
    }
});
</script>
