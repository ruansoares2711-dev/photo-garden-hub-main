import { createFileRoute } from "@tanstack/react-router";
import { AdminController } from "@/controller/pages/AdminController";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Punctum" }] }),
  component: AdminController,
});
