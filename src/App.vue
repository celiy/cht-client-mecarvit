<template>
    <ElectronStartupGate>
        <SystemOwnerGate>
            <RouterView />
            <DevToolsExample />
        </SystemOwnerGate>
    </ElectronStartupGate>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ElectronStartupGate from "@base/electron/ElectronStartupGate.vue";
import DevToolsExample from "./components/DevToolsExample.vue";
import SystemOwnerGate from "./components/SystemOwnerGate.vue";

export default defineComponent({
    name: "MecarvitApp",

    components: {
        ElectronStartupGate,
        DevToolsExample,
        SystemOwnerGate
    }
});
</script>
