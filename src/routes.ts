import type { RouteRecordRaw } from "vue-router";

import MainLayout from "./layouts/MainLayout.vue";
import IndexPage from "./pages/index.vue";
import HomePage from "./pages/home.vue";
import LoginPage from "./pages/login.vue";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        component: MainLayout,
        children: [
            { path: "", name: "index", component: IndexPage },
            { path: "home", name: "home", component: HomePage },
            { path: "login", name: "login", component: LoginPage }
        ]
    }
];

export default routes;
