import { supabase } from "@/integrations/supabase/client";

export const AuthRepository = {
  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  },

  signUp(email: string, password: string, displayName: string, redirectTo: string) {
    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
        emailRedirectTo: redirectTo,
      },
    });
  },

  signOut() {
    return supabase.auth.signOut();
  },

  getSession() {
    return supabase.auth.getSession();
  },

  onAuthStateChange: supabase.auth.onAuthStateChange.bind(supabase.auth),

  async isAdmin(userId: string): Promise<boolean> {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    return !!data;
  },
};
