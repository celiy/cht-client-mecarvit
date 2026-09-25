<template>
    <ElectronStartupGate>
        <RouterView />
        <DevToolsExample />
        <Toast position="bottom" />
    </ElectronStartupGate>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ElectronStartupGate from "@base/electron/ElectronStartupGate.vue";
import DevToolsExample from "./components/DevToolsExample.vue";

export default defineComponent({
    name: "MecarvitApp",

    components: {
        ElectronStartupGate,
        DevToolsExample
    }
});
</script>
