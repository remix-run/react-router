Add `future.unstable_externalReactPlugin` to opt into an app-provided `@vitejs/plugin-react`

- Configure React Compiler and other React plugin options by adding `react()` after `reactRouter()` in your Vite config.
- Preserve the existing compilation and Fast Refresh implementation when the flag is disabled.
