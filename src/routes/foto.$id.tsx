import { createFileRoute } from "@tanstack/react-router";
import { PhotoDetailController } from "@/controller/pages/PhotoDetailController";

export const Route = createFileRoute("/foto/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = Route.useParams();
  return <PhotoDetailController id={id} />;
}
