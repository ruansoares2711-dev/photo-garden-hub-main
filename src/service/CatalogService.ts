import { CategoryRepository } from "@/repository/CategoryRepository";
import { PhotoRepository } from "@/repository/PhotoRepository";
import type { PhotoListItem } from "@/model/Photo";

export const CatalogService = {
  getLatest(limit = 8) {
    return PhotoRepository.listPublished(limit);
  },

  listCategories() {
    return CategoryRepository.list();
  },

  listByCategory(categoryId: string | null) {
    return PhotoRepository.listPublishedByCategory(categoryId);
  },

  /** Filtra em memória por título/tag. */
  filterByQuery(photos: PhotoListItem[], query: string): PhotoListItem[] {
    const q = query.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.tags ?? []).some((t) => t.toLowerCase().includes(q)),
    );
  },

  getDetails(id: string) {
    return PhotoRepository.getById(id);
  },

  getRelated(categoryId: string, excludeId: string) {
    return PhotoRepository.related(categoryId, excludeId);
  },
};
