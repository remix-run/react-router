Detect stale RSC clients during lazy route discovery and reload the destination document

#### Migration

Apps using the default RSC Framework entry do not need to make any changes. Apps with a custom `entry.rsc.tsx` should import the generated client version and pass it to `unstable_matchRSCServerRequest`:

```tsx
import clientVersion from "virtual:react-router/unstable_rsc/client-version";

return unstable_matchRSCServerRequest({
  // ...
  clientVersion,
});
```
