import { CartRepository } from "@/repository/CartRepository";
import type { CartItem } from "@/model/Cart";

export const CartService = {
  list: (userId: string) => CartRepository.listForUser(userId),
  count: (userId: string) => CartRepository.countForUser(userId),
  isInCart: (userId: string, photoId: string) =>
    CartRepository.existsForUserPhoto(userId, photoId),
  add: (userId: string, photoId: string) => CartRepository.add(userId, photoId),
  remove: (itemId: string) => CartRepository.remove(itemId),
  clear: (userId: string) => CartRepository.clear(userId),

  total(items: CartItem[]): number {
    return items.reduce((s, i) => s + (i.photo?.price_cents ?? 0), 0);
  },
};
