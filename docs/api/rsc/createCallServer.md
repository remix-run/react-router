---
title: createCallServer
unstable: true
---

# createCallServer

[MODES: data]

## Summary

Create a React `callServer` implementation for React Router.

```tsx filename=entry.browser.tsx
setServerCallback(
  createCallServer({
    createFromReadableStream,
    createTemporaryReferenceSet,
    encodeReply,
  })
);
```

## Options

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream`. Used to decode payloads from the server.

### encodeReply

Your `react-server-dom-xyz/client`'s `encodeReply`. Used when sending payloads to the server.
