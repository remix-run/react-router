Add CSP nonce support to RSC document rendering

- Add `nonce` options to `unstable_routeRSCServerRequest` and `unstable_RSCStaticRouter`
- Forward the nonce to the HTML renderer and apply it to injected RSC payload scripts and nonce-aware framework components

To adopt nonce-based CSP, update your `entry.ssr.tsx` (run `react-router reveal entry.ssr` first in RSC Framework Mode) to generate a fresh nonce for each request. Pass it to `routeRSCServerRequest`, spread the `renderHTML` options into React's HTML renderer, pass `options.nonce` to `RSCStaticRouter`, and use the same nonce in the `Content-Security-Policy` response header:

```tsx
const nonce = crypto.randomUUID();
const response = await routeRSCServerRequest({
  request,
  serverResponse,
  createFromReadableStream,
  nonce,
  async renderHTML(getPayload, options) {
    const payload = getPayload();
    return renderHTMLToReadableStream(
      <RSCStaticRouter getPayload={getPayload} nonce={options.nonce} />,
      {
        ...options,
        bootstrapScriptContent,
        formState: await payload.formState,
        signal: request.signal,
      },
    );
  },
});
response.headers.set(
  "Content-Security-Policy",
  `script-src 'self' 'nonce-${nonce}'`,
);
```
