#### Web Streams Default Server Entry

Non-Node runtime Framework Mode apps no longer need a custom `entry.server.tsx` file using React's `renderToReadableStream` API. Apps with `@react-router/{node,express,serve}` dependencies will continue to default to `renderToPipeableStream`, while non-Node apps default to `renderToReadableStream`.

Because Web Streams are stable in Node 22+, Node apps can also opt-into the Web Streams default entry with the new `future.unstable_enableNodeReadableStream` flag:

```ts filename=react-router.config.ts
import type { Config } from "@react-router/dev/config";

export default {
  future: {
    unstable_enableNodeReadableStream: true,
  },
} satisfies Config;
```

This flag has no effect if you have a custom `entry.server.tsx` keep using their custom entry file. It only applies to the default entry used if one doesn't exist.

Node apps opting-into the Web Streams API _might_ even see a small performance boost because React Router already uses Web Streams internally, so this avoids additional conversions between Web/Node streams. If you see perf changes one way or another upon adopting this flag, please let us know!
