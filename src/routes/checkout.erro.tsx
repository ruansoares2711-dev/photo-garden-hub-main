import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/checkout/erro")({
  component: () => (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <XCircle className="mb-4 h-16 w-16 text-destructive" />
      <h1 className="font-display text-3xl font-semibold">Pagamento não concluído</h1>
      <p className="mt-2 text-muted-foreground">Algo deu errado. Tente novamente.</p>
      <Button asChild className="mt-6">
        <Link to="/carrinho">Voltar ao carrinho</Link>
      </Button>
    </div>
  ),
});
