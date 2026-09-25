<template>
    <main class="flex max-w-2xl flex-col gap-6 p-8">
        <section>
            <h2 class="mb-2!">Dashboard</h2>

            <Tabs>
                <template #tab-title-0>Entradas e Saídas</template>
                <template #tab-title-1>Ordens de Serviço</template>

                <template #tab-content-0> </template>

                <template #tab-content-1> </template>
            </Tabs>
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
