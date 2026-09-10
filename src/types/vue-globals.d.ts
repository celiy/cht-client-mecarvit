import type { Router, RouteLocationNormalizedLoaded } from "vue-router";
import type { ProjectState } from "@base/project";
import type { HttpClient } from "@base/http";
import type { MecarvitState } from "../js/mecarvit";

declare module "vue" {
    interface ComponentCustomProperties {
        /**
         * Injected by `cht-base` (`projectPlugin`). Types match `cht-base/src/project.ts`.
         */
        $project: ProjectState;

        /**
         * Injected by `cht-base` (`httpPlugin`).
         */
        $http: HttpClient;

        $mecarvit: MecarvitState;
        $router: Router;
        $route: RouteLocationNormalizedLoaded;
    }
}

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $project: ProjectState;
        $http: HttpClient;
        $mecarvit: MecarvitState;
        $router: Router;
        $route: RouteLocationNormalizedLoaded;
    }
}

export {};
