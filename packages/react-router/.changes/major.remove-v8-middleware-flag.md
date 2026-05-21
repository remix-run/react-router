Remove `future.v8_middleware` flag — middleware is always enabled in v8

- The `future.v8_middleware` flag has been removed; middleware is now always enabled
- The `context` parameter passed to `loader`, `action`, and `middleware` functions is always a `RouterContextProvider` instance
- `getLoadContext` functions in custom servers must return a `RouterContextProvider` — returning a plain object is no longer supported
- The `MiddlewareEnabled` type (previously exported as `UNSAFE_MiddlewareEnabled`) has been removed since the conditional it gated is now unconditional
- The `Future` module augmentation pattern (`interface Future { v8_middleware: true }`) is no longer needed to type `context` in Data Mode
