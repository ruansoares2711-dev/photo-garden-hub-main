import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

type CheckoutCartRow = {
  photos: {
    id: string;
    title: string;
    price_cents: number;
    preview_path: string;
  } | null;
};

/**
 * Cria uma compra (pending), monta itens, chama Mercado Pago para criar uma preferência
 * e retorna o init_point (URL de checkout).
 */
export const createCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { origin: string }) => z.object({ origin: z.string().url() }).parse(d))
  .handler(async ({ context, data }) => {
    console.log("LOG: Função createCheckout iniciada!"); // LOG DE TESTE
    
    const { supabase, userId } = context;
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    
    if (!token) {
      console.error("ERRO: Token não encontrado");
      throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");
    }

    // ... (restante do código até o fetch)

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify(prefBody),
    });

    const responseText = await res.text();
    console.log("LOG: Resposta do MP:", res.status, responseText); // LOG DE TESTE

    if (!res.ok) {
      throw new Error(`Mercado Pago falhou: ${res.status} - ${responseText}`);
    }
    
    const pref = JSON.parse(responseText);

    return {
      purchaseId: purchase.id,
      initPoint: pref.init_point || pref.sandbox_init_point,
    };
  });

/**
 * Gera URL assinada para baixar o original. Apenas se o usuário comprou e a compra está paga.
 */
export const getDownloadUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { photoId: string }) => z.object({ photoId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { userId } = context;

    // Verifica propriedade sem depender de RPC exposto ao client.
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
