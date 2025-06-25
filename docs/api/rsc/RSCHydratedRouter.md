---
title: RSCHydratedRouter
---

# RSCHydratedRouter

[MODES: data]

## Summary

Hydrates a server rendered `ServerPayload` in the browser.

## Props

### createFromReadableStream

Your `react-server-dom-xyz/client`'s `createFromReadableStream` function, used to decode payloads from the server.

### payload

The decoded ServerPayload to hydrate.

### routeDiscovery

`eager` or `lazy` - Determines if links are eagerly discovered, or delayed until clicked.
