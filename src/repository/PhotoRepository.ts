import { supabase } from "@/integrations/supabase/client";
import { storageBuckets } from "@/config/storage";
import type { Photo, PhotoListItem } from "@/model/Photo";

export const PhotoRepository = {
  async listPublished(limit?: number): Promise<PhotoListItem[]> {
    let q = supabase
      .from("photos")
      .select("id, title, price_cents, preview_path")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as PhotoListItem[];
  },

  async listPublishedByCategory(categoryId: string | null): Promise<PhotoListItem[]> {
    let q = supabase
      .from("photos")
      .select("id, title, price_cents, preview_path, tags, category_id")
      .eq("published", true)
      .order("created_at", { ascending: false });
    if (categoryId) q = q.eq("category_id", categoryId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as PhotoListItem[];
  },

  async getById(id: string): Promise<(Photo & { categories?: { name: string; slug: string } | null }) | null> {
    const { data, error } = await supabase
      .from("photos")
      .select("*, categories:category_id ( name, slug )")
      .eq("id", id)
      .eq("published", true)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  },

  async related(categoryId: string, excludeId: string, limit = 4): Promise<PhotoListItem[]> {
    const { data, error } = await supabase
      .from("photos")
      .select("id, title, price_cents, preview_path")
      .eq("published", true)
      .eq("category_id", categoryId)
      .neq("id", excludeId)
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as PhotoListItem[];
  },

  async listAllForAdmin() {
    const { data, error } = await supabase
      .from("photos")
      .select("id, title, price_cents, preview_path, original_path, published, category_id")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async insert(payload: {
    title: string;
    description: string | null;
    tags: string[];
    price_cents: number;
    category_id: string | null;
    preview_path: string;
    original_path: string;
    published: boolean;
  }) {
    const { error } = await supabase.from("photos").insert(payload);
    if (error) throw error;
  },

  async deleteById(id: string) {
    const { error } = await supabase.from("photos").delete().eq("id", id);
    if (error) throw error;
  },

  async uploadOriginal(path: string, file: File) {
    const { error } = await supabase.storage
      .from(storageBuckets.original)
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
  },

  async uploadPreview(path: string, blob: Blob) {
    const { error } = await supabase.storage
      .from(storageBuckets.preview)
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) throw error;
  },

  async removeFiles(previewPath: string, originalPath: string) {
    await supabase.storage.from(storageBuckets.preview).remove([previewPath]);
    await supabase.storage.from(storageBuckets.original).remove([originalPath]);
  },
};
