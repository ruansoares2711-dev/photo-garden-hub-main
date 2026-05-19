import { createFileRoute } from "@tanstack/react-router";
import { AccountController } from "@/controller/pages/AccountController";

export const Route = createFileRoute("/conta")({
  head: () => ({ meta: [{ title: "Minha conta — Punctum" }] }),
  component: AccountController,
});
