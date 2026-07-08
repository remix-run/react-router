Add a Web Streams default server entry for non-Node Framework mode apps

- Apps using `@react-router/node`, `@react-router/express`, or `@react-router/serve` continue to use the `renderToPipeableStream` default server entry
- Apps without those Node server adapter dependencies use a `renderToReadableStream` default server entry
- Non-Node apps with their own `entry.server.tsx` may be able to remove it in favor of the default if it is not doing anything custom
