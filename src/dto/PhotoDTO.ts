export interface NewPhotoInput {
  title: string;
  description: string | null;
  tags: string[];
  priceCents: number;
  categoryId: string | null;
  file: File;
}
