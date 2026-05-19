import { createFileRoute } from "@tanstack/react-router";
import { CheckoutSuccessController } from "@/controller/pages/CheckoutSuccessController";

export const Route = createFileRoute("/checkout/sucesso")({
  validateSearch: (s: Record<string, unknown>) => ({ pid: (s.pid as string) || "" }),
  component: RouteComponent,
});

function RouteComponent() {
  const { pid } = Route.useSearch();
  return <CheckoutSuccessController pid={pid} />;
}
