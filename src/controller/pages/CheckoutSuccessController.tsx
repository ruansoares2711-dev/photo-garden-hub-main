import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { CheckoutService } from "@/service/CheckoutService";
import { CartService } from "@/service/CartService";

interface Props {
  pid: string;
}

export function CheckoutSuccessController({ pid }: Props) {
  const { user } = useAuth();
  const _navigate = useNavigate();
  const [status, setStatus] = useState<string>("pending");

  useEffect(() => {
    if (!user || !pid) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const s = await CheckoutService.getPurchaseStatus(pid).catch(() => null);
      if (s === "paid") {
        setStatus("paid");
        await CartService.clear(user.id).catch(() => {});
        clearInterval(interval);
      } else if (attempts > 20) {
        clearInterval(interval);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [user, pid]);

  return (
    <div className="container mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      {status === "paid" ? (
        <>
          <CheckCircle2 className="mb-4 h-16 w-16 text-success" />
          <h1 className="font-display text-3xl font-semibold">Pagamento confirmado!</h1>
          <p className="mt-2 text-muted-foreground">Suas fotos já estão disponíveis para download.</p>
          <Button asChild className="mt-6">
            <Link to="/conta">Ir para minha conta</Link>
          </Button>
        </>
      ) : (
        <>
          <Loader2 className="mb-4 h-16 w-16 animate-spin text-primary" />
          <h1 className="font-display text-3xl font-semibold">Aguardando confirmação</h1>
          <p className="mt-2 text-muted-foreground">
            Estamos confirmando seu pagamento. Isso pode levar alguns segundos.
          </p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/conta">Ver minhas compras</Link>
          </Button>
        </>
      )}
    </div>
  );
}
