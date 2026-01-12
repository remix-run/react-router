import {
  Link,
  useLoaderData,
  useLocation,
  useSearchParams,
} from "react-router";
import { type Photo, getPhoto, ImageGallery, PhotoDisplay } from "~/photos";
import type { Route } from "./+types/_index";

export function clientLoader({ request }: Route.LoaderArgs) {
  let sp = new URL(request.url).searchParams;
  let photo = sp.has("photo") ? getPhoto(sp.get("photo")!) : null;
  return { photo };
}

export default function Index({ loaderData }: Route.ComponentProps) {
  let data = useLoaderData() as { photo: Photo | null };
  let location = useLocation();
  const [searchParams] = useSearchParams();
  searchParams.set("foo", "bar");
  return (
    <>
      <ImageGallery />
      {data.photo && (
        <dialog open>
          <PhotoDisplay photo={data.photo} />
          <Link to={{ search: location.rewrite?.search + "&query=dogs" }}>
            Add query
          </Link>
        </dialog>
      )}
    </>
  );
}
