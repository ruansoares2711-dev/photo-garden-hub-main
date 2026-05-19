import { useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { PhotoCard } from "@/components/PhotoCard";
import { formatBRL, previewUrl } from "@/lib/format";
import { ShoppingBag, Check, Download } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { CheckoutService } from "@/service/CheckoutService";
import { CartService } from "@/service/CartService";
import { CatalogService } from "@/service/CatalogService";
import { env } from "@/config/env";
import type { Photo, PhotoListItem } from "@/model/Photo";

type PhotoDetails = Photo & {
  categories?: { name: string } | null;
};

interface Props {
  id: string;
}

export function PhotoDetailController({ id }: Props) {
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [photo, setPhoto] = useState<PhotoDetails | null>(null);
  const [related, setRelated] = useState<PhotoListItem[]>([]);
  const [inCart, setInCart] = useState(false);
  const [owned, setOwned] = useState(false);
  const [loading, setLoading] = useState(true);
  const downloadFn = useServerFn(CheckoutService.serverGetDownloadUrl);

  useEffect(() => {
    setLoading(true);
    CatalogService.getDetails(id)
      .then(async (data) => {
        setPhoto(data);
        setLoading(false);
        if (data?.category_id) {
          const rel = await CatalogService.getRelated(data.category_id, id);
          setRelated(rel);
        }
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    CartService.isInCart(user.id, id)
      .then(setInCart)
      .catch(() => {});
    CheckoutService.userOwnsPhoto(user.id, id)
      .then(setOwned)
      .catch(() => {});
  }, [user, id]);

  const addToCart = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    try {
      await CartService.add(user.id, id);
      setInCart(true);
      toast.success("Adicionado ao carrinho");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao adicionar ao carrinho");
    }
  };

  const handleDownload = async () => {
    try {
      if (!session?.access_token)
        throw new Error("Sessão expirada. Entre novamente para continuar.");
      const { url } = await downloadFn({
        data: { photoId: id },
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      window.location.href = url;
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Falha ao gerar o link de download");
    }
  };

  if (loading) return <div className="container mx-auto p-10">Carregando...</div>;
  if (!photo) return <div className="container mx-auto p-10">Foto não encontrada.</div>;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div className="relative overflow-hidden rounded-2xl bg-muted shadow-card">
          <img
            src={previewUrl(env.supabaseUrl, photo.preview_path)}
            alt={photo.title}
            className="w-full"
          />
          {!owned && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span className="select-none rotate-[-20deg] font-display text-7xl font-bold text-white/30 mix-blend-overlay">
                PUNCTUM · PREVIEW
              </span>
            </div>
          )}
        </div>

        <div>
          {photo.categories && (
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {photo.categories.name}
            </span>
          )}
          <h1 className="mt-2 font-display text-4xl font-semibold">{photo.title}</h1>
          {photo.description && <p className="mt-4 text-muted-foreground">{photo.description}</p>}

          <div className="mt-6 text-3xl font-semibold text-primary">
            {formatBRL(photo.price_cents)}
          </div>

          {owned ? (
            <Button onClick={handleDownload} size="lg" className="mt-6 w-full">
              <Download className="mr-2 h-4 w-4" /> Baixar original
            </Button>
          ) : inCart ? (
            <Button asChild size="lg" variant="outline" className="mt-6 w-full">
              <Link to="/carrinho">
                <Check className="mr-2 h-4 w-4" /> No carrinho — ir para checkout
              </Link>
            </Button>
          ) : (
            <Button onClick={addToCart} size="lg" className="mt-6 w-full">
              <ShoppingBag className="mr-2 h-4 w-4" /> Adicionar ao carrinho
            </Button>
          )}

          {photo.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {photo.tags.map((t: string) => (
                <span key={t} className="rounded-full bg-secondary px-3 py-1 text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 rounded-xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">O que está incluso</p>
            <ul className="mt-2 space-y-1">
              <li>• Arquivo original em alta resolução</li>
              <li>• Licença para uso pessoal e comercial</li>
              <li>• Download imediato após o pagamento</li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 font-display text-2xl font-semibold">Você também pode gostar</h2>
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {related.map((p) => (
              <PhotoCard key={p.id} photo={p} supabaseUrl={env.supabaseUrl} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
