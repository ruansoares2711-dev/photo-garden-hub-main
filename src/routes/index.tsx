import { createFileRoute } from "@tanstack/react-router";
import { HomeController } from "@/controller/pages/HomeController";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Punctum — Fotos digitais com curadoria" },
      { name: "description", content: "Banco de imagens com curadoria. Compre, baixe e use fotos de alta qualidade em segundos." },
    ],
  }),
  component: HomeController,
});
