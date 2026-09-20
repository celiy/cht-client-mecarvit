<template>
    <main class="flex min-h-dvh items-center justify-center p-6">
        <Card class="w-full max-w-md">
            <template #header>
                <h1 class="text-xl font-semibold">
                    Trocar senha
                </h1>

                <p class="text-sm text-muted-foreground!">
                    Defina uma senha própria antes de continuar.
                </p>
            </template>

            <template #body>
                <ChangePasswordForm @success="onSuccess" />
            </template>
        </Card>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import Card from "@design/components/Card.vue";
import ChangePasswordForm from "../components/ChangePasswordForm.vue";

export default defineComponent({
    name: "MecarvitChangePasswordPage",

    components: {
        Card,
        ChangePasswordForm
    },

    methods: {
        async onSuccess() {
            await this.$router.push("/home");
        }
    }
});
</script>
