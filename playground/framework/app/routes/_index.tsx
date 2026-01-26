import {
  Link,
  useLoaderData,
  useLocation,
  useSearchParams,
  type LinkProps,
  type LinksProps,
  type To,
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
      <pre>useLocation: {JSON.stringify(location)}</pre>
      <ImageGallery />
      {data.photo && (
        <dialog open>
          <PhotoDisplay photo={data.photo} />
          <br />
          <MaskedLink search="?foo=bar">Add query (masked)</MaskedLink>
        </dialog>
      )}
    </>
  );
}

function MaskedLink({
  search,
  children,
}: {
  search: string;
  children?: React.ReactNode;
}) {
  let location = useLocation();
  let additiveParams = new URLSearchParams(search);
  let locationParams = new URLSearchParams(location.search);
  additiveParams.forEach((value, key) => {
    locationParams.set(key, value);
  });
  let maskParams = location.unstable_mask
    ? new URLSearchParams(location.unstable_mask.search)
    : null;
  if (maskParams) {
    additiveParams.forEach((value, key) => {
      maskParams.set(key, value);
    });
  }
  return (
    <Link
      to={{ search: `?${locationParams.toString()}` }}
      unstable_mask={{ search: `?${maskParams?.toString()}` }}
    >
      {children}
    </Link>
  );
}
