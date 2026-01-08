import { Link } from "react-router";

export type Photo = {
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

export async function getPhotos() {
  return PHOTOS;
}

export function getPhoto(id: string): Photo {
  if (!(id in PHOTOS)) {
    throw new Error("Photo not found");
  }
  return PHOTOS[id];
}

export function PhotoDisplay({ photo }: { photo: Photo }) {
  return <img src={photo.url} alt={photo.alt} />;
}

export function ImageGallery() {
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
