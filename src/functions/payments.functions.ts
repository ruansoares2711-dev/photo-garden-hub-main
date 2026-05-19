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
    const { supabase, userId } = context;
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!token) throw new Error("MERCADO_PAGO_ACCESS_TOKEN não configurado");

    // Busca itens do carrinho com fotos (RLS garante que só vê os próprios)
    const { data: items, error } = await supabase
      .from("cart_items")
      .select("photo_id, photos:photo_id ( id, title, price_cents, preview_path )")
      .eq("user_id", userId);
    if (error) throw error;
    if (!items || items.length === 0) throw new Error("Carrinho vazio");

    const photos = ((items ?? []) as CheckoutCartRow[])
      .map((item) => item.photos)
      .filter((photo): photo is NonNullable<CheckoutCartRow["photos"]> => Boolean(photo));

    const total = photos.reduce((s, p) => s + p.price_cents, 0);

    // Cria compra pending via admin (insere + items)
    const { data: purchase, error: pErr } = await supabaseAdmin
      .from("purchases")
      .insert({ user_id: userId, status: "pending", total_cents: total })
      .select()
      .single();
    if (pErr || !purchase) throw pErr ?? new Error("Falha ao criar pedido");

    const itemsRows = photos.map((p) => ({
      purchase_id: purchase.id,
      photo_id: p.id,
      price_cents: p.price_cents,
    }));
    const { error: piErr } = await supabaseAdmin.from("purchase_items").insert(itemsRows);
    if (piErr) throw piErr;

    // Cria preferência no MP
    const mpItems = photos.map((p) => ({
      id: p.id,
      title: p.title.slice(0, 250),
      quantity: 1,
      currency_id: "BRL",
      unit_price: Number((p.price_cents / 100).toFixed(2)),
    }));

    const origin = data.origin;
    const prefBody = {
      items: mpItems,
      external_reference: purchase.id,
      back_urls: {
        success: `${origin}/checkout/sucesso?pid=${purchase.id}`,
        failure: `${origin}/checkout/erro?pid=${purchase.id}`,
        pending: `${origin}/checkout/pendente?pid=${purchase.id}`,
      },
      auto_return: "approved",
      notification_url: `${origin}/api/public/mp-webhook`,
    };

    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(prefBody),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("MP error", res.status, text);
      throw new Error(`Mercado Pago falhou: ${res.status}`);
    }
    const pref = (await res.json()) as {
      id: string;
      init_point: string;
      sandbox_init_point: string;
    };

    await supabaseAdmin
      .from("purchases")
      .update({ mp_preference_id: pref.id })
      .eq("id", purchase.id);

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
