<template>
    <main class="p-8">
        <h1 class="text-2xl font-semibold">{{ $project.labels.siteTitle }}</h1>
        <p class="mt-2 text-muted-foreground">
            Cliente mecarvit carregado pelo cht-base.
        </p>
    </main>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "MecarvitHome"
});
</script>
