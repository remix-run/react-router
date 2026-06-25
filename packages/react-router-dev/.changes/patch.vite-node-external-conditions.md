Only add the `"node"` Vite server condition for Framework mode apps that declare a Node server adapter dependency

This prevents non-Node SSR runtimes from resolving Node-specific package exports by default.
