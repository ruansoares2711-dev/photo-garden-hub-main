import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

/**
 * Schema de validação para o checkout
 */
const checkoutInputSchema = z.object({ 
  origin: z.string().url() 
});

type CheckoutInput = z.infer<typeof checkoutInputSchema>;

/**
 * Cria uma compra (pending), monta itens, chama Mercado Pago para criar uma preferência
 * e retorna o init_point (URL de checkout).
 */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => {
    console.log("=== SERVER: Input validation ===");
    console.log("Input:", d);
    const validated = checkoutInputSchema.parse(d);
    console.log("Validated:", validated);
    return validated;
  })
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    console.log("=== SERVER: CHECKOUT INICIADO ===");
    console.log("userId:", userId);
    console.log("origin:", data.origin);

    try {
      // 1. Buscar itens do carrinho do usuário para montar a preferência
      console.log("=== SERVER: Buscando itens do carrinho ===");
      const { data: cartItems, error: cartErr } = await supabase
        .from("cart_items")
        .select("photos(id, title, price_cents)")
        .eq("user_id", userId);

      console.log("cartItems:", cartItems?.length || 0, "items");
      console.log("cartErr:", cartErr);

      if (cartErr || !cartItems || cartItems.length === 0) {
        throw new Error("Carrinho vazio ou erro ao carregar itens.");
      }

      // 2. Criar registro de compra no banco
      console.log("=== SERVER: Criando registro de compra ===");
      const { data: purchase, error: pErr } = await supabase
        .from("purchases")
        .insert({ user_id: userId, status: "pending" })
        .select("id")
        .single();

      console.log("purchase:", purchase);
      console.log("pErr:", pErr);

      if (pErr || !purchase) {
        console.error("ERRO: Falha ao criar registro de compra", pErr);
        throw new Error("Não foi possível iniciar a compra.");
      }

      // 3. Montar corpo para o Mercado Pago
      console.log("=== SERVER: Montando corpo para Mercado Pago ===");
      const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

      const prefBody = {
        items: cartItems.map((item) => ({
          title: item.photos?.title || "Foto",
          unit_price: (item.photos?.price_cents || 0) / 100,
          quantity: 1,
        })),
        back_urls: {
          success: `${data.origin}/sucesso`,
          failure: `${data.origin}/carrinho`,
        },
        external_reference: purchase.id,
        auto_return: "approved",
      };

      console.log("prefBody:", JSON.stringify(prefBody, null, 2));

      // 4. Chamada ao Mercado Pago
      console.log("=== SERVER: Chamando API Mercado Pago ===");
      const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(prefBody),
      });

      console.log("MP Response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("MP Erro:", errorData);
        throw new Error("Falha ao integrar com Mercado Pago.");
      }

      const pref = await res.json();
      console.log("MP Response:", pref);

      // Validar resposta do Mercado Pago
      if (!pref.init_point && !pref.sandbox_init_point) {
        console.error("Resposta inválida do Mercado Pago:", pref);
        throw new Error("Resposta inválida do Mercado Pago.");
      }

      const response = {
        purchaseId: purchase.id,
        initPoint: pref.init_point || pref.sandbox_init_point,
      };

      console.log("=== SERVER: Retornando resposta ===");
      console.log("response:", response);

      return response;
    } catch (err: any) {
      console.error("=== SERVER: ERRO GERAL ===");
      console.error("Error message:", err?.message);
      console.error("Error stack:", err?.stack);
      throw err;
    }
  });

/**
 * Gera URL assinada para baixar o original.
 */
export const getDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ photoId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { userId } = context;

    const { data: paidPurchase, error: ownErr } = await supabaseAdmin
      .from("purchases")
      .select("id, purchase_items!inner(id)")
      .eq("user_id", userId)
      .eq("status", "paid")
      .eq("purchase_items.photo_id", data.photoId)
      .limit(1)
      .maybeSingle();

    if (ownErr) throw ownErr;
    if (!paidPurchase) throw new Error("Você não comprou esta foto");

    const { data: photo, error: phErr } = await supabaseAdmin
      .from("photos")
      .select("original_path, title")
      .eq("id", data.photoId)
      .single();
    if (phErr || !photo) throw phErr ?? new Error("Foto não encontrada");

    const { data: signed, error: sErr } = await supabaseAdmin.storage
      .from("photos-original")
      .createSignedUrl(photo.original_path, 60 * 5, { download: photo.title });
      
    if (sErr || !signed) throw sErr ?? new Error("Falha ao gerar link");

    return { url: signed.signedUrl };
  });