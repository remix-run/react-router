---
title: getRSCStream
unstable: true
---

# getRSCStream

[MODES: data]

## Summary

Get the prerendered RSC stream for hydration. Usually passed directly to your `react-server-dom-xyz/client`'s `createFromReadableStream`.

```tsx filename=entry.browser.tsx lines=[1]
createFromReadableStream(getRSCStream()).then(
  (payload: RSCServerPayload) => {
    startTransition(async () => {
      hydrateRoot(
        document,
        <StrictMode>
          <RSCHydratedRouter /* props */ />
        </StrictMode>,
        {
          /* ... */
        }
      );
    });
  }
);
```
