Fix TypeError: Invalid URL crash when splat route receives encoded backslash

Sending a request with an encoded backslash (`/%5C`) to a splat route caused a server crash with `TypeError: Invalid URL` inside `encodeLocation`. The server decodes `%5C` to a literal `\`, which `new URL()` rejects as an invalid URL path character.

`encodeLocation` in `server.tsx` now pre-encodes backslashes before constructing the `URL` object, matching the existing pattern for trailing spaces.
