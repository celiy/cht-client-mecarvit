<template>
    <div class="flex items-start gap-2 h-fit">
        <Button
            class="p-2.5"
            aria-label="Recarregar"
            :class="{
                'animate-spin': loading
            }"

            :disabled="loading"

            @click="$emit('reload')"
        >
            <span class="fa-solid fa-rotate-right text-xs" />
        </Button>

        <div class="flex w-full justify-end gap-2 h-fit">
            <div class="flex flex-wrap justify-end gap-2 h-fit">
                <div
                    v-for="filter in visibleInputFilters"
                    :key="'div-input-' + filter.value"

                    class="h-fit"
                >
                    <Input
                        :id="`filter-${filter.value}`"
                        :key="filter.value"

                        class="min-w-48 max-w-xs"

                        :type="inputTypeFor(filter)"
                        :placeholder="filter.label"
                        :model-value="inputValues[filter.value] ?? ''"

                        @update:model-value="onInputValue(filter.value, $event)"
                    />
                </div>

                <div
                    v-for="filter in visibleSelectFilters"
                    :key="'div-select-' + filter.value"

                    class="h-fit min-w-56 max-w-sm"
                >
                    <Select
                        :id="`filter-${filter.value}`"
                        :header="filter.label"
                        class="w-full"
                        :options="selectOptionsFor(filter)"
                        :search="filter.search"
                        :select-multiple="filter.multiple ? { min: 0 } : undefined"
                        :model-value="selectModelValue(filter)"

                        @update:value="onSelectValue(filter, $event)"
                        @search:external="onSelectSearch(filter, $event)"
                    />
                </div>
            </div>

            <div class="relative h-fit w-fit">
                <Button
                    class="p-2.5"
                    aria-label="Filtros"

                    @click.stop="filtersOpen = !filtersOpen"
                >
                    <span class="fa-solid fa-filter text-xs" />
                </Button>

                <Dropdown
                    v-model:open="filtersOpen"

                    hide-dropdown-arrow
                    show-checkmark
                    :close-on-select="false"
                    :min-width-px="180"
                    :options="dropdownOptions"
                    :is-option-selected="isFilterOptionSelected"

                    @click:value="onDropdownSelect"
                />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Dropdown from "@design/components/Dropdown.vue";
import Input from "@design/components/Input.vue";
import Select from "@design/components/Select.vue";
import type { OptionItem } from "@design/components/internal/OptionsList.vue";

export type FilterInputType =
    | "cpf"
    | "cnpj"
    | "email"
    | "phone"
    | "cep"
    | "password"
    | "text"
    | "number"
    | "money"
    | "date"
    | "textarea";

export type FilterOptionChoice = {
    label: string;
    value: string;
    default?: boolean;
};

export type FilterInputDef = {
    type: "input";
    value: string;
    label: string;
    default?: boolean;
    inputType?: FilterInputType;
};

export type FilterOptionDef = {
    type: "option";
    value: string;
    label: string;
    options: FilterOptionChoice[];
};

export type FilterSelectDef = {
    type: "select";
    value: string;
    label: string;
    default?: boolean;
    multiple?: boolean;
    options?: FilterOptionChoice[];
    search?: {
        external: boolean;
        field?: string;
    };
};

export type FilterDef = FilterInputDef | FilterOptionDef | FilterSelectDef;

export type FilterValues = Record<string, string>;

type SelectOption = {
    label: string;
    value: string;
};

function isInputFilter(filter: FilterDef): filter is FilterInputDef {
    return filter.type === "input";
}

function isOptionFilter(filter: FilterDef): filter is FilterOptionDef {
    return filter.type === "option";
}

function isSelectFilter(filter: FilterDef): filter is FilterSelectDef {
    return filter.type === "select";
}

export default defineComponent({
    name: "FilterInputs",

    components: {
        Button,
        Dropdown,
        Input,
        Select
    },

    props: {
        filters: {
            type: Array as PropType<FilterDef[]>,
            required: true
        },

        loading: {
            type: Boolean,
            required: false
        },

        /**
         * Dynamic options for `type: "select"` filters (e.g. external search).
         */
        filterSelectOptions: {
            type: Object as PropType<Record<string, SelectOption[]>>,
            default: () => ({})
        }
    },

    emits: ["filters", "reload", "search:external"],

    data() {
        return {
            inputValues: {} as Record<string, string>,
            visibleInputKeys: [] as string[],
            visibleSelectKeys: [] as string[],
            optionSelections: {} as Record<string, string[]>,
            selectSelections: {} as Record<string, string[]>,
            filtersOpen: false,
            emitTimer: null as number | null
        };
    },

    computed: {
        visibleInputFilters(): FilterInputDef[] {
            return this.filters.filter(isInputFilter)
                .filter((filter) => this.visibleInputKeys.includes(filter.value));
        },

        visibleSelectFilters(): FilterSelectDef[] {
            return this.filters.filter(isSelectFilter)
                .filter((filter) => this.visibleSelectKeys.includes(filter.value));
        },

        dropdownOptions(): OptionItem[] {
            return this.filters.map((filter) => {
                if (isOptionFilter(filter)) {
                    return {
                        label: filter.label,
                        value: filter.value,
                        options: filter.options.map((choice) => ({
                            label: choice.label,
                            value: choice.value
                        }))
                    };
                }

                return {
                    label: filter.label,
                    value: filter.value,
                    disabled: Boolean(filter.default)
                };
            });
        }
    },

    watch: {
        filters: {
            handler() {
                this.hydrateFromFilters();
                this.emitFilters();
            },
            immediate: true,
            deep: true
        }
    },

    beforeUnmount() {
        this.clearEmitTimer();
    },

    methods: {
        hydrateFromFilters() {
            const inputValues: Record<string, string> = { ...this.inputValues };
            const visibleInputKeys: string[] = [];
            const visibleSelectKeys: string[] = [];
            const optionSelections: Record<string, string[]> = { ...this.optionSelections };
            const selectSelections: Record<string, string[]> = { ...this.selectSelections };

            for (const filter of this.filters) {
                if (isInputFilter(filter)) {
                    if (inputValues[filter.value] === undefined) {
                        inputValues[filter.value] = "";
                    }

                    if (filter.default || this.visibleInputKeys.includes(filter.value)) {
                        visibleInputKeys.push(filter.value);
                    }

                    continue;
                }

                if (isSelectFilter(filter)) {
                    if (!selectSelections[filter.value]) {
                        selectSelections[filter.value] = [];
                    }

                    if (filter.default || this.visibleSelectKeys.includes(filter.value)) {
                        visibleSelectKeys.push(filter.value);
                    }

                    continue;
                }

                const previous = this.optionSelections[filter.value];
                const defaultChoice = filter.options.find((choice) => choice.default)?.value;
                const previousChoice = previous?.[0];

                optionSelections[filter.value] = previousChoice
                    ? [previousChoice]
                    : defaultChoice
                        ? [defaultChoice]
                        : [];
            }

            this.inputValues = inputValues;
            this.visibleInputKeys = visibleInputKeys;
            this.visibleSelectKeys = visibleSelectKeys;
            this.optionSelections = optionSelections;
            this.selectSelections = selectSelections;
        },

        selectOptionsFor(filter: FilterSelectDef): SelectOption[] {
            const dynamic = this.filterSelectOptions[filter.value];

            if (dynamic && dynamic.length > 0) {
                return dynamic;
            }

            return (filter.options ?? []).map((choice) => ({
                label: choice.label,
                value: choice.value
            }));
        },

        selectModelValue(filter: FilterSelectDef): string | string[] {
            const selected = this.selectSelections[filter.value] ?? [];

            if (filter.multiple) {
                return selected;
            }

            return selected[0] ?? "";
        },

        inputTypeFor(filter: FilterInputDef): FilterInputType {
            if (filter.inputType) {
                return filter.inputType;
            }

            if (
                filter.value === "cpf"
                || filter.value === "cnpj"
                || filter.value === "email"
                || filter.value === "phone"
                || filter.value === "cep"
            ) {
                return filter.value;
            }

            return "text";
        },

        serializedInputValue(filter: FilterInputDef): string {
            const raw = (this.inputValues[filter.value] ?? "").trim();

            if (!raw) {
                return "";
            }

            const inputType = this.inputTypeFor(filter);

            if (
                inputType === "cpf"
                || inputType === "cnpj"
                || inputType === "phone"
                || inputType === "cep"
            ) {
                return raw.replace(/\D/g, "");
            }

            return raw;
        },

        currentFilterValues(): FilterValues {
            const values: FilterValues = {};

            for (const filter of this.filters) {
                if (isInputFilter(filter)) {
                    if (!this.visibleInputKeys.includes(filter.value)) {
                        continue;
                    }

                    const inputValue = this.serializedInputValue(filter);

                    if (inputValue) {
                        values[filter.value] = inputValue;
                    }

                    continue;
                }

                if (isSelectFilter(filter)) {
                    if (!this.visibleSelectKeys.includes(filter.value)) {
                        continue;
                    }

                    const selected = this.selectSelections[filter.value] ?? [];

                    if (selected.length > 0) {
                        values[filter.value] = selected.join(",");
                    }

                    continue;
                }

                const selected = this.optionSelections[filter.value] ?? [];

                if (selected.length > 0) {
                    values[filter.value] = selected.join(",");
                }
            }

            return values;
        },

        emitFilters() {
            this.$emit("filters", this.currentFilterValues());
        },

        scheduleEmit() {
            this.clearEmitTimer();
            this.emitTimer = window.setTimeout(() => {
                this.emitTimer = null;
                this.emitFilters();
            }, 280);
        },

        clearEmitTimer() {
            if (this.emitTimer == null) {
                return;
            }

            window.clearTimeout(this.emitTimer);
            this.emitTimer = null;
        },

        onInputValue(key: string, value: string | number | boolean) {
            this.inputValues = {
                ...this.inputValues,
                [key]: String(value ?? "")
            };
            this.scheduleEmit();
        },

        onSelectValue(filter: FilterSelectDef, value: string | string[]) {
            const next = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];

            this.selectSelections = {
                ...this.selectSelections,
                [filter.value]: next
            };
            this.emitFilters();
        },

        onSelectSearch(
            filter: FilterSelectDef,
            payload: { field: string; value: string }
        ) {
            this.$emit("search:external", {
                filterKey: filter.value,
                field: payload.field || filter.search?.field || "id",
                value: payload.value
            });
        },

        isFilterOptionSelected(
            value: string | undefined,
            _item?: OptionItem,
            parent?: OptionItem
        ): boolean {
            if (!value) {
                return false;
            }

            if (parent?.value) {
                return (this.optionSelections[parent.value] ?? []).includes(value);
            }

            const filter = this.filters.find((entry) => entry.value === value);

            if (!filter) {
                return false;
            }

            if (isInputFilter(filter)) {
                return this.visibleInputKeys.includes(filter.value);
            }

            if (isSelectFilter(filter)) {
                return this.visibleSelectKeys.includes(filter.value);
            }

            return false;
        },

        onDropdownSelect(value: string, _item?: OptionItem, parent?: OptionItem) {
            if (parent?.value) {
                this.setOptionValue(parent.value, value);
                this.emitFilters();

                return;
            }

            const filter = this.filters.find((entry) => entry.value === value);

            if (!filter || filter.default) {
                return;
            }

            if (isInputFilter(filter)) {
                if (this.visibleInputKeys.includes(filter.value)) {
                    this.visibleInputKeys = this.visibleInputKeys.filter((key) => key !== filter.value);
                    this.inputValues = {
                        ...this.inputValues,
                        [filter.value]: ""
                    };
                } else {
                    this.visibleInputKeys = [...this.visibleInputKeys, filter.value];
                }

                this.emitFilters();

                return;
            }

            if (isSelectFilter(filter)) {
                if (this.visibleSelectKeys.includes(filter.value)) {
                    this.visibleSelectKeys = this.visibleSelectKeys.filter((key) => key !== filter.value);
                    this.selectSelections = {
                        ...this.selectSelections,
                        [filter.value]: []
                    };
                } else {
                    this.visibleSelectKeys = [...this.visibleSelectKeys, filter.value];
                }

                this.emitFilters();
            }
        },

        setOptionValue(field: string, choice: string) {
            this.optionSelections = {
                ...this.optionSelections,
                [field]: [choice]
            };
        }
    }
});
</script>
