import { Link } from "@tanstack/react-router";
import { formatBRL, previewUrl } from "@/lib/format";

interface Props {
  photo: {
    id: string;
    title: string;
    price_cents: number;
    preview_path: string;
  };
  supabaseUrl: string;
}

export function PhotoCard({ photo, supabaseUrl }: Props) {
  return (
    <Link
      to="/foto/$id"
      params={{ id: photo.id }}
      className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:shadow-elegant"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={previewUrl(supabaseUrl, photo.preview_path)}
          alt={photo.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="flex items-center justify-between p-4">
        <h3 className="truncate text-sm font-medium">{photo.title}</h3>
        <span className="shrink-0 text-sm font-semibold text-primary">{formatBRL(photo.price_cents)}</span>
      </div>
    </Link>
  );
}
