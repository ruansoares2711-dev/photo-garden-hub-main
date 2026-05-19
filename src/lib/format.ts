export function formatBRL(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function previewUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/photos-preview/${path}`;
}
