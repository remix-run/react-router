---
title: routeRSCServerRequest
unstable: true
---

# routeRSCServerRequest

[MODES: data]

## Summary

Routes the incoming request to the RSC server and appropriately proxies the server response for data / resource requests, or renders to HTML for a document request.

```tsx filename=entry.ssr.tsx
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

## Options

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### fetchServer

A function that forwards a `Request` to the RSC handler and returns a `Promise<Response>` containing a serialized `RSCPayload`.

### renderHTML

A function that renders the `RSCPayload` to HTML, usually using a `<RSCStaticRouter>`.

### request

The request to route.
