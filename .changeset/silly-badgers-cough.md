---
"react-router": patch
---

[UNSTABLE] Add support for `<Link unstable_mask>` which allows users to navigate to a URL in the router but "mask" the URL displayed in the browser. This is useful for contextual routing usages such as displaying an image in a model on top of a gallery, but displaying a browser URL directly to the image that can be shared and loaded without the contextual gallery in the background.

```tsx
// routes/gallery.tsx
export function clientLoader({ request }: Route.LoaderArgs) {
  let sp = new URL(request.url).searchParams;
  return {
    images: getImages(),
    modalImage: sp.has("image") ? getImage(sp.get("image")!) : null,
  };
}

export default function Gallery({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <GalleryGrid>
        {loaderData.images.map((image) => (
          <Link
            key={image.id}
            to={`/gallery?image=${image.id}`}
            unstable_mask={`/images/${image.id}`}
          >
            <img src={image.url} alt={image.alt} />
          </Link>
        ))}
      </GalleryGrid>

      {data.modalImage ? (
        <dialog open>
          <img src={data.modalImage.url} alt={data.modalImage.alt} />
        </dialog>
      ) : null}
    </>
  );
}
```
