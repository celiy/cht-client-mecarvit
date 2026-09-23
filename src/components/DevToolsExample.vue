<template>
    <Modal
        :is-open="open"

        @update:value="onOpenChange"
    >
        <template #header>
            Teste
        </template>

        <template #body>
            <p class="text-sm text-muted-foreground">
                Opção de exemplo do modo dev.
            </p>
        </template>

        <template #footer>
            <div class="flex justify-end">
                <Button
                    label="Fechar"

                    @click="open = false"
                />
            </div>
        </template>
    </Modal>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { toast } from "@design/toast/toast";
import { registerDevToolsOptions } from "@base/devTools";

export default defineComponent({
    name: "DevToolsExample",

    data() {
        return {
            open: false,
            unregisterDevTools: null as (() => void) | null
        };
    },

    created() {
        this.unregisterDevTools = registerDevToolsOptions([
            {
                id: "mecarvit-teste",
                label: "Teste",
                icon: "fa-flask",
                run: () => {
                    this.open = true;
                }
            }
        ]);
    },

    unmounted() {
        this.unregisterDevTools?.();
        this.unregisterDevTools = null;
    },

    methods: {
        onOpenChange(next: boolean) {
            this.open = next;

            if (next) {
                toast.info("Teste");
            }
        }
    }
});
</script>
