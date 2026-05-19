import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhotoCard } from "@/components/PhotoCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Download, Shield } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { CatalogService } from "@/service/CatalogService";
import { env } from "@/config/env";
import type { PhotoListItem } from "@/model/Photo";

export function HomeController() {
  const [photos, setPhotos] = useState<PhotoListItem[]>([]);

  useEffect(() => {
    CatalogService.getLatest(8).then(setPhotos).catch(() => setPhotos([]));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt="" className="h-full w-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>
        <div className="container relative mx-auto flex flex-col items-center px-4 py-24 text-center md:py-36">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="punctum-dot inline-block h-1.5 w-1.5 rounded-full" aria-hidden />
            O detalhe que faz a imagem
          </span>
          <h1 className="text-balance font-display text-5xl font-semibold leading-[1.05] md:text-7xl">
            O ponto que <span className="bg-gradient-hero bg-clip-text text-transparent">toca</span> em cada imagem.
          </h1>
          <p className="mt-6 max-w-xl text-balance text-lg text-muted-foreground">
            Punctum é o banco de fotos digitais com curadoria humana. Compre uma vez, use para sempre.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/catalogo">
                Explorar catálogo <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Criar conta</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card/40">
        <div className="container mx-auto grid gap-8 px-4 py-12 md:grid-cols-3">
          {[
            { icon: Search, title: "Busca rápida", desc: "Filtre por categoria e palavras-chave." },
            { icon: Download, title: "Download imediato", desc: "Receba o original em alta após o pagamento." },
            { icon: Shield, title: "Compra segura", desc: "Pagamento via Mercado Pago. Acesso protegido." },
          ].map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold md:text-4xl">Novidades</h2>
            <p className="text-muted-foreground">Selecionamos o que há de mais recente.</p>
          </div>
          <Link to="/catalogo" className="hidden text-sm font-medium text-primary hover:underline md:inline">
            Ver tudo →
          </Link>
        </div>
        {photos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
            Nenhuma foto publicada ainda. <Link to="/admin" className="text-primary hover:underline">Adicionar no admin</Link>.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {photos.map((p) => (
              <PhotoCard key={p.id} photo={p} supabaseUrl={env.supabaseUrl} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
