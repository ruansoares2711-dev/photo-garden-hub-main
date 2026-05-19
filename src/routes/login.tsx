import { createFileRoute } from "@tanstack/react-router";
import { LoginController } from "@/controller/pages/LoginController";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar — Punctum" }] }),
  component: LoginController,
});
