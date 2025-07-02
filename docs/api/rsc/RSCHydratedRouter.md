---
title: RSCHydratedRouter
unstable: true
---

# RSCHydratedRouter

[MODES: data]

## Summary

Hydrates a server rendered `RSCPayload` in the browser.

## Props

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### payload

The decoded `RSCPayload` to hydrate.

### routeDiscovery

`eager` or `lazy` - Determines if links are eagerly discovered, or delayed until clicked.
