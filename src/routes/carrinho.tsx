import { createFileRoute } from "@tanstack/react-router";
import { CartController } from "@/controller/pages/CartController";

export const Route = createFileRoute("/carrinho")({
  head: () => ({ meta: [{ title: "Carrinho — Punctum" }] }),
  component: CartController,
});
