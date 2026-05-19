import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/model/Cart";

export const CartRepository = {
  async listForUser(userId: string): Promise<CartItem[]> {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, photo:photo_id ( id, title, price_cents, preview_path )")
      .eq("user_id", userId);
    if (error) throw error;
    return (data ?? []) as unknown as CartItem[];
  },

  async countForUser(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from("cart_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId);
    if (error) throw error;
    return count ?? 0;
  },

  async existsForUserPhoto(userId: string, photoId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", userId)
      .eq("photo_id", photoId)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  },

  async add(userId: string, photoId: string) {
    const { error } = await supabase.from("cart_items").insert({ user_id: userId, photo_id: photoId });
    if (error) throw error;
  },

  async remove(itemId: string) {
    const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
    if (error) throw error;
  },

  async clear(userId: string) {
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
    if (error) throw error;
  },
};
