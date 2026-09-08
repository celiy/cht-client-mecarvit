import type { ProjectState } from "@base/project";
import type { HttpClient } from "@base/http";

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
    }
}

declare module "@vue/runtime-core" {
    interface ComponentCustomProperties {
        $project: ProjectState;
        $http: HttpClient;
    }
}

export {};
