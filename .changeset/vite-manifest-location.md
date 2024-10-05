---
"@react-router/dev": major
---

For Remix consumers migrating to React Router, Vite manifests (i.e. `.vite/manifest.json`) are now written within each build subdirectory, e.g. `build/client/.vite/manifest.json` and `build/server/.vite/manifest.json` instead of `build/.vite/client-manifest.json` and `build/.vite/server-manifest.json`. This means that the build output is now much closer to what you'd expect from a typical Vite project.

Originally the Remix Vite plugin moved all Vite manifests to a root-level `build/.vite` directory to avoid accidentally serving them in production, particularly from the client build. This was later improved with additional logic that deleted these Vite manifest files at the end of the build process unless Vite's `build.manifest` had been enabled within the app's Vite config. This greatly reduced the risk of accidentally serving the Vite manifests in production since they're only present when explicitly asked for. As a result, we can now assume that consumers will know that they need to manage these additional files themselves, and React Router can safely generate a more standard Vite build output.
