Add `ssr: "unstable_api-only"` to build server bundles that retain route loaders and actions without including route UI exports

- API-only builds continue to support client-side navigation and server data requests while not handling document requests in production.
