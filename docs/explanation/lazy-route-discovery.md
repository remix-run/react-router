---
title: Lazy Route Discovery
---

# Lazy Route Discovery

[MODES: framework]

<br/>
<br/>

Lazy Route Discovery is a performance optimization that loads route information progressively as users navigate through your application, rather than loading the complete route manifest upfront.

With Lazy Route Discovery enabled (the default), React Router sends only the routes needed for the initial server-side render in the manifest. As users navigate to new parts of your application, additional route information is fetched dynamically and added to the client-side manifest.

The route manifest contains metadata about your routes (JavaScript/CSS imports, whether routes have `loaders`/`actions`, etc.) but not the actual route module implementations. This allows React Router to understand your application's structure without downloading unnecessary route information.

## Route Discovery Process

When a user navigates to a new route that isn't in the current manifest:

1. **Route Discovery Request** - React Router makes a request to the internal `/__manifest` endpoint
2. **Manifest Patch** - The server responds with the required route information
3. **Route Loading** - React Router loads the necessary route modules and data
4. **Navigation** - The user navigates to the new route

## Eager Discovery Optimization

To prevent navigation waterfalls, React Router implements eager route discovery. All [`<Link>`](../api/components/Link) and [`<NavLink>`](../api/components/NavLink) components rendered on the current page are automatically discovered via a batched request to the server.

This discovery request typically completes before users click any links, making subsequent navigation feel synchronous even with lazy route discovery enabled.

```tsx
// Links are automatically discovered by default
<Link to="/dashboard">Dashboard</Link>

// Opt out of discovery for specific links
<Link to="/admin" discover="none">Admin</Link>
```

## Performance Benefits

Lazy Route Discovery provides several performance improvements:

- **Faster Initial Load** - Smaller initial bundle size by excluding unused route metadata
- **Reduced Memory Usage** - Route information is loaded only when needed
- **Scalability** - Applications with hundreds of routes see more significant benefits

## Configuration

You can configure route discovery behavior in your `react-router.config.ts`:

```tsx filename=react-router.config.ts
export default {
  // Default: lazy discovery with /__manifest endpoint
  routeDiscovery: {
    mode: "lazy",
    manifestPath: "/__manifest",
  },

  // Custom manifest path (useful for multiple apps on same domain)
  routeDiscovery: {
    mode: "lazy",
    manifestPath: "/my-app-manifest",
  },

  // Disable lazy discovery (include all routes initially)
  routeDiscovery: { mode: "initial" },
} satisfies Config;
```

## Deployment Considerations

When using lazy route discovery, ensure your deployment setup handles manifest requests properly:

- **Route Handling** - Ensure `/__manifest` requests reach your React Router handler
- **CDN Caching** - If using CDN/edge caching, include `version` and `paths` query parameters in your cache key for the manifest endpoint
- **Multiple Applications** - Use a custom `manifestPath` if running multiple React Router applications on the same domain
