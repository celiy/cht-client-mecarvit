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
import { projectActions } from "@base/project";

export default defineComponent({
    name: "MecarvitApp",

    components: {
        ElectronStartupGate,
        DevToolsExample
    },

    /**
     * Creates the component
     * @returns {void}
     */
    created() {
        projectActions.setCustomTheme("hodiernus");
    }
});
</script>
