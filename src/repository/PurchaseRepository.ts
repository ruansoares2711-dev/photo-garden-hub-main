import { supabase } from "@/integrations/supabase/client";
import type { Purchase } from "@/model/Purchase";

export const PurchaseRepository = {
  async listForUser(userId: string): Promise<Purchase[]> {
    const { data, error } = await supabase
      .from("purchases")
      .select("*, purchase_items ( id, price_cents, photo:photo_id ( id, title, preview_path ) )")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as unknown as Purchase[];
  },

  async getStatus(id: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("purchases")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data?.status ?? null;
  },

  async userOwnsPhoto(userId: string, photoId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("purchases")
      .select("id, purchase_items!inner(id)")
      .eq("user_id", userId)
      .eq("status", "paid")
      .eq("purchase_items.photo_id", photoId)
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },
};
