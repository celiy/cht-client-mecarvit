<template>
    <div
        class="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 pb-4 text-center"
    >
        <div
            class="flex h-12 w-12 items-center justify-center rounded-full bg-background text-muted-foreground shadow-sm ring-1 ring-border/80"
        >
            <span class="fa-solid fa-magnifying-glass text-lg" />
        </div>

        <div class="space-y-1">
            <h4>
                {{ title }}
            </h4>

            <p>
                {{ description }}
            </p>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
    name: "EmptyTableMessage",

    props: {
        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        }
    }
});
</script>
