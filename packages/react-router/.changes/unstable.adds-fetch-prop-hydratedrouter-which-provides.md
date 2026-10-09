Add a new `<HydratedRouter unstable_fetch>` prop which allows applicatons to provide a custom fetch implementation for client-side issued manifest and data requests
 - The function receives the intended request as well as context identifying the type of request
 - Like other router initialization options, the implementation is captured when the singleton router is created and thus subsequent prop changes are ignored
- Browser-managed data prefetches from `<Link prefetch>` use native `<link rel="prefetch">` elements and do not call the custom implementation
- Intended use cases include custom fetch options, custom headers, automatic retry logic, response header inspection, etc.
- This is not intended to alter response bodies because they are turbo-stream encoded and that would beak the types expected by your component code
