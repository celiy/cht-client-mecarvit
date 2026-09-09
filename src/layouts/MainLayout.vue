<template>
    <main class="relative flex h-dvh w-full flex-col overflow-hidden">
        <Sidebar
            :nav-items="[
                {
                    type: 'section',
                    label: 'Mecarvit'
                },
                {
                    type: 'link',
                    label: 'Index',
                    link: '/'
                },
                {
                    type: 'link',
                    label: 'Home',
                    link: '/home'
                }
            ]"
        >
            <RouterView />
        </Sidebar>
    </main>
</template>

<script setup lang="ts"></script>
