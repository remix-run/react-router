#### RSC Entry Updates

This release includes several updates for unstable RSC apps that use custom entry files. Apps using the default RSC Framework entries do not need any changes.

If you maintain custom RSC entries, review the generated unstable change notes for the new client version, subresource integrity, and CSP nonce wiring. Custom `entry.rsc.tsx` files should pass the generated client version to `unstable_matchRSCServerRequest`, and custom `entry.ssr.tsx` files may need to pass the generated import map integrity data and request nonce through React's HTML renderer.
