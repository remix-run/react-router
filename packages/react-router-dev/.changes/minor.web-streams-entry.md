Change the default `entry.server.tsx` to use React's `renderToReadableStream` because that is now available in the Node 22 baseline in React Router v8

- This should not have any functional changes for your app, and may even have a small performance boost because of the reduced conversions between node streams and web streams
- If you have a non-customized `entry.server.tsx` using `renderToReadableStream`, you may be able to remove it from your app
- If you wish to continue using `renderToPipeableStream`, you can add your own `entry.server.tsx` file based on the previous default [implementation](https://github.com/remix-run/react-router/blob/react-router%408.0.0/packages/react-router-dev/config/defaults/entry.server.node.tsx)
