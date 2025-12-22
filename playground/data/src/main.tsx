import * as React from "react";
import * as ReactClient from "react-dom/client";
import {
  Link,
  createBrowserRouter,
  useLoaderData,
  useParams,
} from "react-router";
import { RouterProvider } from "react-router/dom";

type Photo = {
  id: string;
  url: string;
  alt: string;
};

const PHOTOS: Record<string, Photo> = {
  "1": {
    id: "1",
    url: "https://placecats.com/300/200",
    alt: "Tabby cat lounging",
  },
  "2": {
    id: "2",
    url: "https://placecats.com/400/300",
    alt: "Orange cat playing",
  },
  "3": {
    id: "3",
    url: "https://placecats.com/350/250",
    alt: "Black cat sleeping",
  },
  "4": {
    id: "4",
    url: "https://placecats.com/500/400",
    alt: "White cat sitting",
  },
  "5": {
    id: "5",
    url: "https://placecats.com/450/350",
    alt: "Grey cat looking",
  },
};

const router = createBrowserRouter([
  {
    id: "index",
    path: "/",
    loader({ request }) {
      let sp = new URL(request.url).searchParams;
      let photo = sp.has("photo") ? getPhoto(sp.get("photo")!) : null;
      console.log("returning from loader", photo);
      return { photo };
    },
    Component() {
      let data = useLoaderData() as { photo: Photo | null };
      console.log("data in component", data);
      return (
        <>
          <h1>Hello React Router (data mode)</h1>
          <ImageGallery />
          {data.photo && (
            <dialog open>
              <PhotoDisplay photo={data.photo} />
            </dialog>
          )}
        </>
      );
    },
  },
  {
    id: "image",
    path: "/images/:id",
    loader({ params }) {
      if (!params.id || typeof params.id !== "string") {
        throw new Error("Image ID is required");
      }
      let photo = getPhoto(params.id);
      return { photo };
    },
    Component() {
      let data = useLoaderData() as { photo: Photo };
      return (
        <>
          <h1>Images Page</h1>
          <PhotoDisplay photo={data.photo} />
        </>
      );
    },
  },
]);

window.router = router;

function PhotoDisplay({ photo }: { photo: Photo }) {
  return <img src={photo.url} alt={photo.alt} />;
}

function ImageGallery() {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        padding: "16px",
      }}
    >
      {Object.values(PHOTOS).map((photo) => (
        <Link
          key={photo.id}
          to={`/images/${photo.id}`}
          rewrite={`/?photo=${photo.id}`}
        >
          <img
            src={photo.url}
            alt={photo.alt}
            style={{ width: "100%", height: "auto", borderRadius: "8px" }}
          />
        </Link>
      ))}
    </div>
  );
}
function getPhoto(id: string): Photo {
  if (!(id in PHOTOS)) {
    throw new Error("Photo not found");
  }
  return PHOTOS[id];
}

ReactClient.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
