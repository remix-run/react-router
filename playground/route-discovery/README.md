# Route discovery playground

Conventional Framework Mode with `future.unstable_customRouteDiscovery` enabled.
The small custom hook is in `app/use-playground-discovery.ts`.

From the repository root (with workspace packages already built):

```sh
pnpm install
pnpm --filter @playground/route-discovery build
pnpm --filter @playground/route-discovery start
```

Open http://localhost:3000/a. Set `PORT=3001` on the start command if needed.
This needs one initial production build. Switching simulation controls or
handler behavior needs no rebuild. Editing the app or package code still needs
a rebuild. `pnpm --filter @playground/route-discovery dev` works for editing the
UI, but development has a complete manifest and bypasses discovery.

## Try it

1. Enable **Simulate manifest mismatch** and leave **On mismatch** at **Cancel**.
2. Type an unsaved draft on `/a` and submit **Increment counter and redirect to /b**.
3. The server increments its counter, but discovery of `/b` is canceled. The URL,
   draft, and old loader data stay on `/a`; navigation settles to idle.
4. Click **Revalidate** to see the updated counter. Cancellation does not undo the
   mutation or run another loader pass automatically.
5. Select **Load all routes and continue** and submit again. The custom handler
   loads the real versioned manifest and the redirect finishes at `/b`.

Use **Reset to /a** between scenarios. It reloads the document with a partial
manifest, resets the handler choice to Cancel, and clears the event log and
draft. It preserves the simulation cookies and the server counter; restarting
the server resets the counter. Once `/b` is discovered or the full manifest is
loaded, navigating to `/b` no longer needs discovery.

Other checks:

- Turn off mismatch simulation, reset, and navigate to `/b` for normal discovery.
- Select **Default behavior**, then navigate to undiscovered `/b` to hard reload
  the destination. A fetcher mismatch instead reloads the current page, and an
  imperative mismatch does not reload.
- **Fetch /b** and the fetcher submit button exercise fetcher discovery and action redirects.
- **Discover /b** exercises imperative discovery and logs its result.
- **Load all routes** completes the manifest without navigating or running loaders.
- Enable the 1.5-second delay to see pending state. Revalidate while navigation
  discovery is pending to check that cancellation settles both operations.

All links/forms disable eager discovery with `discover="none"`. The native Reset
link also avoids eager discovery. `server.js` intercepts only `/__manifest`,
returning a synthetic 204 with `X-Remix-Reload-Document` when the mismatch cookie
is set. It keeps real manifest assets and loader/action requests intact. This
tests client recovery mechanics, not server compatibility across real builds.
