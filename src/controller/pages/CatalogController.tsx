import { useEffect, useMemo, useState } from "react";
import { PhotoCard } from "@/components/PhotoCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { CatalogService } from "@/service/CatalogService";
import { env } from "@/config/env";
import type { PhotoListItem } from "@/model/Photo";
import type { Category } from "@/model/Category";

export function CatalogController() {
  const [photos, setPhotos] = useState<PhotoListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    CatalogService.listCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    CatalogService.listByCategory(activeCat)
      .then((data) => setPhotos(data))
      .finally(() => setLoading(false));
  }, [activeCat]);

  const filtered = useMemo(() => CatalogService.filterByQuery(photos, q), [photos, q]);

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-6 font-display text-4xl font-semibold">Catálogo</h1>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título ou tag..."
            className="pl-9"
          />
        </div>
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button size="sm" variant={activeCat === null ? "default" : "outline"} onClick={() => setActiveCat(null)}>
          Todas
        </Button>
        {categories.map((c) => (
          <Button
            key={c.id}
            size="sm"
            variant={activeCat === c.id ? "default" : "outline"}
            onClick={() => setActiveCat(c.id)}
          >
            {c.name}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
          Nenhuma foto encontrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <PhotoCard key={p.id} photo={p} supabaseUrl={env.supabaseUrl} />
          ))}
        </div>
      )}
    </div>
  );
}
