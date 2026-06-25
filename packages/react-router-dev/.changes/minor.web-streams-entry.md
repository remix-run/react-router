Adds a `ReactDOMServer.renderToReadableStream`-based default server entry for for non-Node runtimes

- This means you no longer need to provide your own `entry.server.tsx` if you need to render via `ReactDOMServer.renderToReadableStream`
- Node-runtime detection is based on the presence of `@react-router/{node,express,serve}` in your `package.json`
