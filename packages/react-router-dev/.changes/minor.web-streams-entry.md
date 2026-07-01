Change the default `entry.server.tsx` to use React's `renderToReadableStream` which is now available in React Router v8's Node 22 baseline

- Framework mode apps no longer require a custom `entry.server.tsx` file to run in non-Node runtimes (i.e., Cloudflare)
- This should not have any functional changes for your app
  - You may see a small performance boost because of the reduced conversions between node streams and web streams
  - You may eliminate initial fallback flickers for promises resolved prior to render
    - Our testing showed that `renderToPipeableStream` would render the fallback and stream an immediate chunk with the resolved value
    - `renderToReadableStream` skips the fallback and renders the resolved value in the critical HTML
- If you have your own `entry.server.tsx` using `renderToReadableStream`, you may be able to remove it from your app if the logic matches the [default implementation](https://github.com/remix-run/react-router/blob/main/packages/react-router-dev/config/defaults/entry.server.tsx)
- If you wish to continue using `renderToPipeableStream`, you can add your own `entry.server.tsx` file based on the previous [node implementation](https://github.com/remix-run/react-router/blob/react-router%408.0.0/packages/react-router-dev/config/defaults/entry.server.node.tsx)
- You can also remove `@react-router/node` from your dependencies if you also have `@react-router/serve` or `@react-router/express`, since we no longer need the dependency to determine server entry compatibility across runtimes
