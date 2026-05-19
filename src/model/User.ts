import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export type AppUser = SupabaseUser;
export type AppSession = Session;

export interface AuthState {
  user: AppUser | null;
  session: AppSession | null;
  loading: boolean;
  isAdmin: boolean;
}
