Preserve binary response bodies and text byte order marks in `sendReactRouterResponse`

- Preserve binary bodies even when their content type is absent from `binaryTypes`
- Preserve a leading byte order mark in text bodies
