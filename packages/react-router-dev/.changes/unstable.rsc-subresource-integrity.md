Support the `subResourceIntegrity` config option in RSC Framework Mode

### Migration guide

No changes are required when using the default RSC SSR entry. If you maintain a custom `app/entry.ssr.tsx`, import the new virtual module and pass its hashes to React's `importMap` render option:

```diff
+import subResourceIntegrity from "virtual:react-router/unstable_rsc/subresource-integrity";

return renderToReadableStream(<RSCStaticRouter getPayload={getPayload} />, {
  ...options,
  bootstrapScriptContent,
  formState,
+ importMap: subResourceIntegrity
+   ? { integrity: subResourceIntegrity }
+   : undefined,
  signal: request.signal,
});
```
