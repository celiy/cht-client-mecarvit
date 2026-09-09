<template>
    <ElectronStartupGate>
        <RouterView />
    </ElectronStartupGate>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ElectronStartupGate from "@base/electron/ElectronStartupGate.vue";

export default defineComponent({
    name: "MecarvitApp",

    components: {
        ElectronStartupGate
    }
});
</script>
