import { PhotoRepository } from "@/repository/PhotoRepository";
import type { NewPhotoInput } from "@/dto/PhotoDTO";

/**
 * Cria preview com marca d'água em canvas (browser-only).
 */
async function buildWatermarkedPreview(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = dataUrl;
  });

  const maxW = 1200;
  const scale = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(w / 22)}px sans-serif`;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 8);
  const text = "PUNCTUM · PREVIEW";
  const step = Math.round(w / 4);
  for (let y = -h; y < h; y += step) {
    for (let x = -w; x < w; x += step * 1.2) {
      ctx.fillText(text, x, y);
    }
  }
  ctx.restore();

  return new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.78));
}

export const AdminService = {
  list: () => PhotoRepository.listAllForAdmin(),

  async publish(input: NewPhotoInput) {
    const ext = input.file.name.split(".").pop() || "jpg";
    const baseName = crypto.randomUUID();
    const originalPath = `${baseName}.${ext}`;
    const previewPath = `${baseName}.jpg`;

    await PhotoRepository.uploadOriginal(originalPath, input.file);
    const previewBlob = await buildWatermarkedPreview(input.file);
    await PhotoRepository.uploadPreview(previewPath, previewBlob);

    await PhotoRepository.insert({
      title: input.title,
      description: input.description,
      tags: input.tags,
      price_cents: input.priceCents,
      category_id: input.categoryId,
      preview_path: previewPath,
      original_path: originalPath,
      published: true,
    });
  },

  async delete(photo: { id: string; preview_path: string; original_path: string }) {
    await PhotoRepository.removeFiles(photo.preview_path, photo.original_path);
    await PhotoRepository.deleteById(photo.id);
  },
};
