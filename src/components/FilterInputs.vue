<template>
    <div class="flex flex-wrap items-end gap-2">
        <Input
            v-for="filter in visibleInputFilters"
            :id="`filter-${filter.value}`"
            :key="filter.value"

            class="min-w-48 max-w-xs"

            floating-label
            :type="inputTypeFor(filter)"
            :label="filter.label"
            :model-value="inputValues[filter.value] ?? ''"

            @update:model-value="onInputValue(filter.value, $event)"
        />

        <Dropdown
            hide-dropdown-arrow
            show-checkmark
            :close-on-select="false"
            :min-width-px="180"
            :options="dropdownOptions"
            :is-option-selected="isFilterOptionSelected"

            @click:value="onDropdownSelect"
        >
            <template #button="{ toggle }">
                <Button
                    variant="secondary"
                    left-icon="fa-filter"
                    aria-label="Filtros"

                    @click="toggle"
                />
            </template>
        </Dropdown>
    </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";
import Button from "@design/components/Button.vue";
import Dropdown from "@design/components/Dropdown.vue";
import Input from "@design/components/Input.vue";
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

export type FilterDef = FilterInputDef | FilterOptionDef;

export type FilterValues = Record<string, string>;

function isInputFilter(filter: FilterDef): filter is FilterInputDef {
    return filter.type === "input";
}

function isOptionFilter(filter: FilterDef): filter is FilterOptionDef {
    return filter.type === "option";
}

export default defineComponent({
    name: "FilterInputs",

    components: {
        Button,
        Dropdown,
        Input
    },

    props: {
        filters: {
            type: Array as PropType<FilterDef[]>,
            required: true
        }
    },

    emits: ["filters"],

    data() {
        return {
            inputValues: {} as Record<string, string>,
            visibleInputKeys: [] as string[],
            optionSelections: {} as Record<string, string[]>,
            emitTimer: null as number | null
        };
    },

    computed: {
        visibleInputFilters(): FilterInputDef[] {
            return this.filters.filter(isInputFilter)
                .filter((filter) => this.visibleInputKeys.includes(filter.value));
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
            const optionSelections: Record<string, string[]> = {};

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
            this.optionSelections = optionSelections;
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

        currentFilterValues(): FilterValues {
            const values: FilterValues = {};

            for (const filter of this.filters) {
                if (isInputFilter(filter)) {
                    if (!this.visibleInputKeys.includes(filter.value)) {
                        continue;
                    }

                    const inputValue = (this.inputValues[filter.value] ?? "").trim();

                    if (inputValue) {
                        values[filter.value] = inputValue;
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

            return false;
        },

        onDropdownSelect(value: string, _item?: OptionItem, parent?: OptionItem) {
            if (parent?.value) {
                this.setOptionValue(parent.value, value);
                this.emitFilters();

                return;
            }

            const filter = this.filters.find((entry) => entry.value === value);

            if (!filter || !isInputFilter(filter) || filter.default) {
                return;
            }

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
