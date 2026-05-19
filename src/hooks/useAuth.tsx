import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { AuthService } from "@/service/AuthService";
import type { AuthState } from "@/model/User";

interface AuthContextValue extends AuthState {
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthState["session"]>(null);
  const [user, setUser] = useState<AuthState["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = AuthService.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => {
          AuthService.isAdmin(sess.user.id).then(setIsAdmin);
        }, 0);
      } else {
        setIsAdmin(false);
      }
    });

    AuthService.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
      if (sess?.user) AuthService.isAdmin(sess.user.id).then(setIsAdmin);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await AuthService.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
