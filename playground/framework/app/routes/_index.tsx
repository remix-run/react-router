import { useLoaderData, useLocation } from "react-router";
import { type Photo, getPhoto, ImageGallery, PhotoDisplay } from "~/photos";
import type { Route } from "./+types/_index";

export function loader({ request }: Route.LoaderArgs) {
  let sp = new URL(request.url).searchParams;
  let photo = sp.has("photo") ? getPhoto(sp.get("photo")!) : null;
  return { photo };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  let data = useLoaderData() as { photo: Photo | null };
  let location = useLocation();
  return (
    <>
      <ImageGallery />
      <pre>useLocation: {location.pathname + location.search}</pre>
      {data.photo && (
        <dialog open>
          <PhotoDisplay photo={data.photo} />
        </dialog>
      )}
    </>
  );
}
