import { createCheckout, getDownloadUrl } from "@/functions/payments.functions";
import { PurchaseRepository } from "@/repository/PurchaseRepository";

/** Wrappers do lado client para as server functions de pagamento. */
export const CheckoutService = {
  serverCreateCheckout: createCheckout,
  serverGetDownloadUrl: getDownloadUrl,
  getPurchaseStatus: (id: string) => PurchaseRepository.getStatus(id),
  listPurchases: (userId: string) => PurchaseRepository.listForUser(userId),
  userOwnsPhoto: (userId: string, photoId: string) =>
    PurchaseRepository.userOwnsPhoto(userId, photoId),
};
