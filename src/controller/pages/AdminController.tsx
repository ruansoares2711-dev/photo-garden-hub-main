import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Trash2, Upload } from "lucide-react";
import { formatBRL, previewUrl } from "@/lib/format";
import { AdminService } from "@/service/AdminService";
import { CatalogService } from "@/service/CatalogService";
import { env } from "@/config/env";
import type { Category } from "@/model/Category";

export function AdminController() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [photos, setPhotos] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("19.90");
  const [categoryId, setCategoryId] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [loading, user, isAdmin]);

  const load = () => {
    AdminService.list().then(setPhotos).catch(() => {});
    CatalogService.listCategories().then(setCategories).catch(() => {});
  };

  useEffect(() => {
    if (isAdmin) load();
  }, [isAdmin]);

  const upload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) {
      toast.error("Selecione uma imagem e informe o título");
      return;
    }
    setUploading(true);
    try {
      await AdminService.publish({
        title,
        description: description || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        priceCents: Math.round(parseFloat(price.replace(",", ".")) * 100),
        categoryId: categoryId || null,
        file,
      });
      toast.success("Foto publicada!");
      setFile(null);
      setTitle("");
      setDescription("");
      setTags("");
      setPrice("19.90");
      setCategoryId("");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (photo: any) => {
    if (!confirm(`Excluir "${photo.title}"?`)) return;
    await AdminService.delete(photo);
    load();
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="mb-8 font-display text-4xl font-semibold">Painel admin</h1>

      <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
        <Card className="p-6">
          <h2 className="mb-4 font-display text-xl font-semibold">Nova foto</h2>
          <form onSubmit={upload} className="space-y-4">
            <div>
              <Label htmlFor="file">Imagem original</Label>
              <Input id="file" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
              <p className="mt-1 text-xs text-muted-foreground">O preview com marca d'água é gerado automaticamente.</p>
            </div>
            <div>
              <Label htmlFor="title">Título</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="desc">Descrição</Label>
              <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
            </div>
            <div>
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="natureza, montanha, pôr do sol" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Preço (R$)</Label>
                <Input id="price" value={price} onChange={(e) => setPrice(e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="cat">Categoria</Label>
                <select
                  id="cat"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={uploading}>
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Enviando..." : "Publicar foto"}
            </Button>
          </form>
        </Card>

        <div>
          <h2 className="mb-4 font-display text-xl font-semibold">Catálogo ({photos.length})</h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {photos.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="aspect-[4/3] bg-muted">
                  <img src={previewUrl(env.supabaseUrl, p.preview_path)} alt={p.title} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-medium">{p.title}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-primary">{formatBRL(p.price_cents)}</span>
                    <Button size="icon" variant="ghost" onClick={() => remove(p)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
