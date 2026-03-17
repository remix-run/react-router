Ignore external Vite server environments in Framework Mode build hooks

When `future.v8_viteEnvironmentApi` is enabled, React Router previously treated any non-client Vite environment as its own server build. This caused issues with integrations like Nitro, where plugins can register additional environments.

Framework Mode build hooks now ignore external server environments and only process the app's own server build.
