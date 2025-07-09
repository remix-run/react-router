---
title: RSCHydratedRouter
unstable: true
---

# RSCHydratedRouter

[MODES: data]

## Summary

Hydrates a server rendered `RSCPayload` in the browser.

```tsx filename=entry.browser.tsx lines=[7-12]
createFromReadableStream(getRSCStream()).then(
  (payload: RSCServerPayload) => {
    startTransition(async () => {
      hydrateRoot(
        document,
        <StrictMode>
          <RSCHydratedRouter
            createFromReadableStream={
              createFromReadableStream
            }
            payload={payload}
          />
        </StrictMode>,
        {
          formState: await getFormState(payload),
        }
      );
    });
  }
);
```

## Props

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### payload

The decoded `RSCPayload` to hydrate.

### routeDiscovery

`eager` or `lazy` - Determines if links are eagerly discovered, or delayed until clicked.
