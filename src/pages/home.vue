<template>
    <main class="flex max-w-2xl flex-col gap-6 p-8">
        <section>
            <h1 class="text-2xl font-semibold">Home</h1>

            <p class="mt-2 text-muted-foreground!">
                Área autenticada do {{ $project.labels.siteTitle }}.
            </p>
        </section>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { clearAuthToken } from "@base/http";
import { clearMecarvitSession, loadCurrentCompany, loadCurrentUser } from "../js/mecarvit";

export default defineComponent({
    name: "MecarvitHomePage",

    data() {
        return {
            loadError: ""
        };
    },

    methods: {
        async reloadSession() {
            this.loadError = "";
            await loadCurrentUser();
            await loadCurrentCompany();

            if (!this.$mecarvit.user) {
                this.loadError = "Não foi possível carregar o perfil.";
            }
        },

        async logout() {
            clearAuthToken();
            clearMecarvitSession();
            await this.$router.push("/login");
        }
    }
});
</script>
