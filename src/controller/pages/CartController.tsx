import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatBRL, previewUrl } from "@/lib/format";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { CartService } from "@/service/CartService";
import { CheckoutService } from "@/service/CheckoutService";
import { env } from "@/config/env";
import type { CartItem } from "@/model/Cart";

export function CartController() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [paying, setPaying] = useState(false);
  const checkoutFn = useServerFn(CheckoutService.serverCreateCheckout);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, navigate, user]);

  const load = () => {
    if (!user) return;
    CartService.list(user.id)
      .then(setItems)
      .catch(() => {});
  };

  useEffect(load, [user]);

  const remove = async (id: string) => {
    await CartService.remove(id);
    load();
  };

  const total = CartService.total(items);

  const checkout = async () => {
    setPaying(true);
    try {
      // A chamada CORRETA para um serverFn é passando o payload no campo 'data'
      const result = await createCheckout({
        data: { origin: window.location.origin }
      });

      if (result?.initPoint) {
        window.location.href = result.initPoint;
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 font-display text-4xl font-semibold">Carrinho</h1>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
          <ShoppingBag className="mx-auto mb-3 h-8 w-8" />
          Seu carrinho está vazio.{" "}
          <Link to="/catalogo" className="text-primary hover:underline">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 rounded-xl border border-border bg-card p-3"
              >
                <div className="h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {item.photo?.preview_path && (
                    <img
                      src={previewUrl(env.supabaseUrl, item.photo.preview_path)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <Link
                    to="/foto/$id"
                    params={{ id: item.photo.id }}
                    className="font-medium hover:underline"
                  >
                    {item.photo?.title}
                  </Link>
                  <div className="text-sm text-muted-foreground">
                    {formatBRL(item.photo?.price_cents ?? 0)}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="h-fit rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-display text-xl font-semibold">Resumo</h2>
            <div className="flex items-center justify-between border-b border-border pb-4 text-sm">
              <span className="text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </span>
              <span>{formatBRL(total)}</span>
            </div>
            <div className="flex items-center justify-between pt-4 text-lg font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatBRL(total)}</span>
            </div>
            <Button className="mt-6 w-full" size="lg" onClick={checkout} disabled={paying}>
              {paying ? "Redirecionando..." : "Pagar com Mercado Pago"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Pagamento seguro · Download imediato após confirmação
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
