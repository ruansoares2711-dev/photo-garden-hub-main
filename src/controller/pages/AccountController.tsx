import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/format";
import { Download, ShoppingBag } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { CheckoutService } from "@/service/CheckoutService";
import { toast } from "sonner";
import { env } from "@/config/env";
import type { Purchase } from "@/model/Purchase";

export function AccountController() {
  const { user, session, loading } = useAuth();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const downloadFn = useServerFn(CheckoutService.serverGetDownloadUrl);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [loading, navigate, user]);

  useEffect(() => {
    if (!user) return;
    CheckoutService.listPurchases(user.id)
      .then(setPurchases)
      .catch(() => {});
  }, [user]);

  const download = async (photoId: string) => {
    try {
      if (!session?.access_token)
        throw new Error("Sessão expirada. Entre novamente para continuar.");
      const { url } = await downloadFn({
        data: { photoId },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      window.location.href = url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o link de download");
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-2 font-display text-4xl font-semibold">Minha conta</h1>
      <p className="mb-8 text-muted-foreground">{user.email}</p>

      <h2 className="mb-4 font-display text-2xl font-semibold">Histórico de compras</h2>
      {purchases.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
          <ShoppingBag className="mx-auto mb-3 h-8 w-8" />
          Você ainda não fez nenhuma compra.{" "}
          <Link to="/catalogo" className="text-primary hover:underline">
            Explorar catálogo
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((p) => (
            <div key={p.id} className="rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-sm text-muted-foreground">
                    Pedido #{p.id.slice(0, 8)} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="font-semibold">{formatBRL(p.total_cents)}</div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    p.status === "paid"
                      ? "bg-success/15 text-success"
                      : p.status === "pending"
                        ? "bg-accent text-accent-foreground"
                        : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : "Falhou"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {p.purchase_items?.map((item) => (
                  <div
                    key={item.id}
                    className="overflow-hidden rounded-lg border border-border bg-background"
                  >
                    <div className="aspect-[4/3] bg-muted">
                      {item.photo?.preview_path && (
                        <img
                          src={`${env.supabaseUrl}/storage/v1/object/public/photos-preview/${item.photo.preview_path}`}
                          alt={item.photo.title}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="p-2">
                      <div className="truncate text-xs font-medium">{item.photo?.title}</div>
                      {p.status === "paid" && item.photo && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="mt-1 w-full"
                          onClick={() => download(item.photo!.id)}
                        >
                          <Download className="mr-1 h-3 w-3" /> Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
