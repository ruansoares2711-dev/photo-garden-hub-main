import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatBRL, previewUrl } from "@/lib/format";
import { Trash2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { CartService } from "@/service/CartService";
import { CheckoutService } from "@/service/CheckoutService";
import { env } from "@/config/env";
import type { CartItem } from "@/model/Cart";

export function CartController() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, navigate, user]);

  const load = () => {
    if (!user) return;
    CartService.list(user.id)
      .then((data) => {
        // Filtrar items null ou inválidos
        const validItems = (data || []).filter((item): item is CartItem => 
          item != null && item.id != null && item.photo != null
        );
        setItems(validItems);
      })
      .catch((error) => {
        console.error("Erro ao carregar carrinho:", error);
        setItems([]);
      });
  };

  useEffect(load, [user]);

  const remove = async (id: string) => {
    if (!id) {
      console.error("❌ Remove chamado com id inválido:", id);
      return;
    }
    try {
      await CartService.remove(id);
      load();
    } catch (error) {
      console.error("Erro ao remover item:", error);
      toast.error("Erro ao remover item do carrinho");
    }
  };

  const total = CartService.total(items);

  const checkout = async () => {
    if (paying) return;
    
    setPaying(true);
    try {
      console.log("=== INICIANDO CHECKOUT ===");
      console.log("Origin:", window.location.origin);
      console.log("Items count:", items.length);
      
      // Validar que temos items antes de fazer a chamada
      if (!items || items.length === 0) {
        throw new Error("Carrinho vazio. Adicione itens antes de continuar.");
      }

      let result: any;
      
      try {
        result = await CheckoutService.serverCreateCheckout({ 
          origin: window.location.origin 
        });
      } catch (fetchError: any) {
        console.error("❌ Erro na chamada do servidor:");
        console.error("fetchError:", fetchError);
        throw new Error(`Falha ao conectar com o servidor: ${fetchError?.message || "desconhecido"}`);
      }

      console.log("=== RESULTADO BRUTO ===");
      console.log("Type of result:", typeof result);
      console.log("Result:", result);
      
      if (result) {
        console.log("Result keys:", Object.keys(result).join(", "));
      }

      // Verificação rigorosa da resposta
      if (result === null || result === undefined) {
        throw new Error("Servidor retornou resposta vazia (null/undefined)");
      }

      if (typeof result !== "object") {
        throw new Error(`Tipo de resposta inválido: esperado object, recebeu ${typeof result}`);
      }

      const initPoint = result.initPoint;
      const purchaseId = result.purchaseId;

      console.log("=== VALORES EXTRAÍDOS ===");
      console.log("initPoint:", initPoint, `(type: ${typeof initPoint})`);
      console.log("purchaseId:", purchaseId, `(type: ${typeof purchaseId})`);

      if (!initPoint) {
        throw new Error("initPoint ausente na resposta do servidor");
      }

      if (typeof initPoint !== "string" || initPoint.length === 0) {
        throw new Error(`initPoint inválido: type=${typeof initPoint}, length=${initPoint?.length || 0}`);
      }

      console.log("=== REDIRECIONANDO PARA ===");
      console.log(initPoint);
      
      // Redirecionar para Mercado Pago
      window.location.href = initPoint;
    } catch (error: any) {
      console.error("❌ ERRO AO PROCESSAR CHECKOUT ===");
      console.error("Error object:", error);
      console.error("Error message:", error?.message);
      console.error("Error name:", error?.name);
      console.error("Error code:", error?.code);
      
      if (error?.stack) {
        console.error("Error stack:", error.stack);
      }
      
      const errorMessage = 
        error?.message || 
        error?.toString?.() || 
        "Erro ao processar o pagamento. Tente novamente.";
      
      console.error("❌ Mensagem final:", errorMessage);
      toast.error(errorMessage);
      setPaying(false);
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
            {items.map((item) => {
              // Proteção contra items inválidos
              if (!item || !item.id || !item.photo) {
                return null;
              }
              
              return (
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
              );
            })}
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
            <Button 
              className="mt-6 w-full" 
              size="lg" 
              onClick={checkout} 
              disabled={paying}
            >
              {paying ? "Redirecionando..." : "Pagar com Mercado Pago"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}