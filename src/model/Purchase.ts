export type PurchaseStatus = "pending" | "paid" | "failed";

export interface PurchaseItem {
  id: string;
  price_cents: number;
  photo: {
    id: string;
    title: string;
    preview_path: string;
  } | null;
}

export interface Purchase {
  id: string;
  user_id: string;
  status: PurchaseStatus;
  total_cents: number;
  created_at: string;
  paid_at: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  purchase_items?: PurchaseItem[];
}
