import { createFileRoute } from "@tanstack/react-router";
import { CatalogController } from "@/controller/pages/CatalogController";

export const Route = createFileRoute("/catalogo")({
  head: () => ({
    meta: [
      { title: "Catálogo — Punctum" },
      { name: "description", content: "Navegue pelo catálogo completo de fotos digitais com curadoria." },
    ],
  }),
  component: CatalogController,
});
