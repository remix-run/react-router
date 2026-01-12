import { useLoaderData, useLocation } from "react-router";

import type { Route } from "./+types/image";
import { type Photo, PhotoDisplay, getPhoto } from "../photos";

export function clientLoader({ params }: Route.LoaderArgs) {
  if (!params.id || typeof params.id !== "string") {
    throw new Error("Image ID is required");
  }
  let photo = getPhoto(params.id);
  return { photo };
}

export default function Component({ loaderData }: Route.ComponentProps) {
  let data = useLoaderData() as { photo: Photo };
  return (
    <>
      <h1>Images Page</h1>
      <PhotoDisplay photo={data.photo} />
    </>
  );
}
