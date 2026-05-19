/**
 * Mantido por compatibilidade com TanStack Start, que importa `getRouter`
 * a partir de `src/router.tsx`. A lógica fica na camada `application/main`.
 */
import { createApplicationRouter } from "@/application/main";

export const getRouter = () => createApplicationRouter();
