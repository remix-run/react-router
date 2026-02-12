---
"react-router": patch
---

[UNSTABLE] Add support for `<Link unstable_mask>` in Data Mode which allows users to navigate to a URL in the router but "mask" the URL displayed in the browser. This is useful for contextual routing usages such as displaying an image in a model on top of a gallery, but displaying a browser URL directly to the image that can be shared and loaded without the contextual gallery in the background.

```tsx
// routes/gallery.tsx
export function clientLoader({ request }: Route.LoaderArgs) {
  let sp = new URL(request.url).searchParams;
  return {
    images: getImages(),
    // When the router location has the image param, load the modal data
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
            {/* Navigate the router to /galley?image=N */}}
            to={`/gallery?image=${image.id}`}
            {/* But display /images/N in the URL bar */}}
            unstable_mask={`/images/${image.id}`}
          >
            <img src={image.url} alt={image.alt} />
          </Link>
        ))}
      </GalleryGrid>

      {/* When the modal data exists, display the modal */}
      {data.modalImage ? (
        <dialog open>
          <img src={data.modalImage.url} alt={data.modalImage.alt} />
        </dialog>
      ) : null}
    </>
  );
}
```

Notes:

- The masked location, if present, will be available on `useLocation().unstable_mask` so you can detect whether you are currently masked or not.
- Masked URLs only work for SPA use cases, and will be removed from `history.state` during SSR.
- This provides a first-class API to mask URLs in Data Mode to achieve the same behavior you could do in Declarative Mode via [manual `backgroundLocation` management](https://github.com/remix-run/react-router/tree/main/examples/modal).
