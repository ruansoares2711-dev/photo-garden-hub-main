import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ShoppingBag, User, LogOut, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CartService } from "@/service/CartService";

export function Header() {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setCartCount(0);
      return;
    }
    const load = () => CartService.count(user.id).then(setCartCount).catch(() => {});
    load();
    const ch = supabase
      .channel("cart-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "cart_items", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="group flex items-center gap-2.5 font-display text-xl font-semibold tracking-tight">
          <span className="punctum-dot inline-block h-2.5 w-2.5 rounded-full transition-transform group-hover:scale-125" aria-hidden />
          <span>punctum<span className="text-primary">.</span></span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/catalogo" className="text-sm text-muted-foreground transition-colors hover:text-foreground" activeProps={{ className: "text-sm text-foreground font-medium" }}>
            Catálogo
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/carrinho" })} className="relative">
            <ShoppingBag className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {cartCount}
              </span>
            )}
          </Button>
          {user ? (
            <>
              {isAdmin && (
                <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/admin" })} title="Admin">
                  <Shield className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/conta" })}>
                <User className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut().then(() => navigate({ to: "/" }))}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button onClick={() => navigate({ to: "/login" })} size="sm">
              Entrar
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
