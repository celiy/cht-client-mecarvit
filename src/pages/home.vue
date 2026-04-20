<template>
    <main class="p-8">
        <h1 class="text-2xl font-semibold">Home</h1>
        <p class="mt-2 text-muted-foreground">
            Rota <code class="text-sm">/home</code> — {{ $project.labels.siteTitle }}
        </p>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "MecarvitHomePage"
});
</script>
