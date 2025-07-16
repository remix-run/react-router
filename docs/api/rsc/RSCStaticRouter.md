---
title: RSCStaticRouter
unstable: true
---

# RSCStaticRouter

[MODES: data]

## Summary

Pre-renders an `RSCPayload` to HTML. Usually used in `routeRSCServerRequest`'s `renderHTML` callback.

```tsx filename=entry.ssr.tsx lines=[9]
routeRSCServerRequest({
  request,
  fetchServer,
  createFromReadableStream,
  async renderHTML(getPayload) {
    const payload = await getPayload();

    return await renderHTMLToReadableStream(
      <RSCStaticRouter getPayload={getPayload} />,
      {
        bootstrapScriptContent,
        formState: await getFormState(payload),
      }
    );
  },
});
```

## Props

### getPayload

A function that starts decoding of the `RSCPayload`. Usually passed through from `routeRSCServerRequest`'s `renderHTML`.
