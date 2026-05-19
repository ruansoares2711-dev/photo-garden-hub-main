import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/checkout/pendente")({
  component: () => (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <Clock className="mb-4 h-16 w-16 text-accent-foreground" />
      <h1 className="font-display text-3xl font-semibold">Pagamento pendente</h1>
      <p className="mt-2 text-muted-foreground">Avisaremos quando for confirmado. Você pode acompanhar em sua conta.</p>
      <Button asChild className="mt-6">
        <Link to="/conta">Ir para minha conta</Link>
      </Button>
    </div>
  ),
});
