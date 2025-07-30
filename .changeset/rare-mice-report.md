---
"react-router": patch
---

[UNSTABLE] Rename and alter the signature/functionality of the `unstable_respond` API in `staticHandler.query`/`staticHandler.queryRoute`

- The API has been renamed to `unstable_generateMiddlewareResponse` for clarity
- The `query` version of the API now has a signature of `(query: (r: Request) => Promise<StaticHandlerContext | Response>) => Promise<Response>`
- The `queryRoute` version of the API now has a signature of `(queryRoute: (r: Request) => Promise<Response>) => Promise<Response>`
- This allows for more advanced usages such as running logic before/after calling `query` and direct error handling of errors thrown from query
- ⚠️ This is a breaking change if you've adopted the `staticHandler` `unstable_respond` API

```tsx
let response = await staticHandler.query(request, {
  requestContext: new unstable_RouterContextProvider(),
  async unstable_generateMiddlewareResponse(query) {
    try {
      // At this point we've run middleware top-down so we need to call the
      // handlers and generate the Response to bubble back up the middleware
      let result = await query(request);
      if (isResponse(result)) {
        return result; // Redirects, etc.
      }
      return await generateHtmlResponse(result);
    } catch (error: unknown) {
      return generateErrorResponse(error);
    }
  },
});
```
