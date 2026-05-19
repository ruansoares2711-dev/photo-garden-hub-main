import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type MercadoPagoPayment = {
  id: number | string;
  status: string;
  external_reference?: string | null;
};

function isTerminalFailure(status: string) {
  return ["rejected", "cancelled", "refunded", "charged_back"].includes(status);
}

async function clearPurchasedItemsFromCart(purchaseId: string) {
  const { data: purchase, error } = await supabaseAdmin
    .from("purchases")
    .select("user_id, purchase_items(photo_id)")
    .eq("id", purchaseId)
    .single();

  if (error || !purchase) {
    console.error("Falha ao carregar pedido para limpar carrinho", error);
    return;
  }

  const photoIds = (purchase.purchase_items ?? [])
    .map((item: { photo_id: string }) => item.photo_id)
    .filter(Boolean);

  if (photoIds.length === 0) return;

  const { error: deleteError } = await supabaseAdmin
    .from("cart_items")
    .delete()
    .eq("user_id", purchase.user_id)
    .in("photo_id", photoIds);

  if (deleteError) console.error("Falha ao limpar carrinho após pagamento", deleteError);
}

/**
 * Webhook público do Mercado Pago.
 *
 * O Mercado Pago pode enviar o identificador do pagamento por query string
 * (`data.id`, `id`) ou no corpo JSON (`data.id`). Para evitar confiar no
 * payload recebido, a rota sempre consulta a API oficial de pagamentos antes
 * de alterar o pedido local.
 */
export const Route = createFileRoute("/api/public/mp-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const token = process.env.MERCADO_PAGO_ACCESS_TOKEN;
          if (!token) return new Response("missing token", { status: 500 });

          const url = new URL(request.url);
          let eventType = url.searchParams.get("topic") || url.searchParams.get("type") || "";
          let paymentId = url.searchParams.get("data.id") || url.searchParams.get("id") || "";

          const text = await request.text();
          if (text) {
            try {
              const body = JSON.parse(text);
              paymentId ||= body?.data?.id ? String(body.data.id) : "";
              eventType ||= body?.type || body?.topic || body?.action || "";
            } catch (error) {
              console.error("Webhook MP recebido com JSON inválido", error);
            }
          }

          if (eventType && !eventType.includes("payment")) {
            return new Response("ok", { status: 200 });
          }

          if (!paymentId) return new Response("ok", { status: 200 });

          const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            const errorText = await res.text().catch(() => "");
            console.error("Falha ao consultar pagamento no Mercado Pago", res.status, errorText);
            return new Response("ok", { status: 200 });
          }

          const payment = (await res.json()) as MercadoPagoPayment;
          const purchaseId = payment.external_reference;
          if (!purchaseId) return new Response("ok", { status: 200 });

          if (payment.status === "approved") {
            const { error } = await supabaseAdmin
              .from("purchases")
              .update({
                status: "paid",
                mp_payment_id: String(payment.id),
                paid_at: new Date().toISOString(),
              })
              .eq("id", purchaseId);

            if (error) throw error;
            await clearPurchasedItemsFromCart(purchaseId);
          } else if (isTerminalFailure(payment.status)) {
            const { error } = await supabaseAdmin
              .from("purchases")
              .update({ status: "failed", mp_payment_id: String(payment.id) })
              .eq("id", purchaseId)
              .neq("status", "paid");

            if (error) throw error;
          }

          return new Response("ok", { status: 200 });
        } catch (error) {
          console.error("mp-webhook error", error);
          return new Response("ok", { status: 200 });
        }
      },
      GET: async () => new Response("ok"),
    },
  },
});
