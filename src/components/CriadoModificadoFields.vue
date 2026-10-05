<template>
    <Item variant="secondary">
        <template #body>
            <div class="grid w-full gap-4 sm:grid-cols-2">
                <Input
                    :id="`${idPrefix}-criadoEm`"
                    type="text"
                    label="Criado em"
                    variant="display"
                    readonly
                    :value="criadoEmLabel"
                />

                <Input
                    :id="`${idPrefix}-modificadoEm`"
                    type="text"
                    label="Modificado em"
                    variant="display"
                    readonly
                    :value="modificadoEmLabel"
                />
            </div>
        </template>
    </Item>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Input from "@design/components/Input.vue";
import Item from "@design/components/Item.vue";
import { formatDateTimeBr } from "@shared/format/dateTime";

export default defineComponent({
    name: "CriadoModificadoFields",

    components: {
        Input,
        Item
    },

    props: {
        criadoEm: {
            type: [String, Number, Date],
            default: ""
        },

        modificadoEm: {
            type: [String, Number, Date],
            default: ""
        },

        idPrefix: {
            type: String,
            default: "audit"
        }
    },

    computed: {
        criadoEmLabel(): string {
            return formatDateTimeBr(this.criadoEm);
        },

        modificadoEmLabel(): string {
            return formatDateTimeBr(this.modificadoEm);
        }
    }
});
</script>
