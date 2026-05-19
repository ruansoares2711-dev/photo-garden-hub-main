/**
 * Entidade Photo (representa uma foto do catálogo).
 */
export interface Photo {
  id: string;
  title: string;
  description: string | null;
  price_cents: number;
  preview_path: string;
  original_path: string;
  category_id: string | null;
  tags: string[];
  published: boolean;
  created_at: string;
}

export interface PhotoListItem {
  id: string;
  title: string;
  price_cents: number;
  preview_path: string;
  tags?: string[];
  category_id?: string | null;
}
