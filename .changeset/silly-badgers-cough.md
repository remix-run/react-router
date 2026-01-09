---
"react-router": patch
---

[UNSTABLE] Add support for `<Link unstable_rewrite>` which allows users to navigate to one URL in the browser but "rewrite" the url that is processed by the router, permitting contextual routing usages such as displaying an image in a model on top of a gallery

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
            to={`/images/${image.id}`}
            unstable_rewrite={`/gallery?image=${image.id}`}
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
