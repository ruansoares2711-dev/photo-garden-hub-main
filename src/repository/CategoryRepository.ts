import { supabase } from "@/integrations/supabase/client";
import type { Category } from "@/model/Category";

export const CategoryRepository = {
  async list(): Promise<Category[]> {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) throw error;
    return (data ?? []) as Category[];
  },
};
