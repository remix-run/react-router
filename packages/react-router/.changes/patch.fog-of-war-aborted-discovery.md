Don't cache a lazily-discovered path when the navigation/fetcher that triggered discovery aborts mid-flight

- Previously, if the signal aborted between the manifest response resolving and the patches being applied, the path was still added to the discovered-paths cache and the manifest while `patchRoutes` no-op'd on the aborted signal, so the route tree was never patched and every later navigation to that path skipped discovery for the rest of the session
