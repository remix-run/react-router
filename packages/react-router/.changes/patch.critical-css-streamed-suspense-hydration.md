Preserve streamed `<Suspense>` boundaries during hydration in development

- Wrap the critical CSS reset in `React.startTransition` to prevent React 19 from silently discarding the server HTML and rendering the boundary on the client
