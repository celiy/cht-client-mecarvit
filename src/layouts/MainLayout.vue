<template>
    <main>
        <Sidebar :nav-items="mainNav">
            <RouterView />
        </Sidebar>
    </main>
</template>

<script setup lang="ts">
import Sidebar from "@design/components/custom/Sidebar.vue";
import { mainNav } from "../nav/mainNav";
</script>
