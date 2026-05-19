import { createRouter } from "@tanstack/react-router";
import { routeTree } from "../routeTree.gen";
import { DefaultErrorComponent } from "../components/DefaultErrorComponent";

export function createApplicationRouter() {
  return createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: DefaultErrorComponent,
  });
}
