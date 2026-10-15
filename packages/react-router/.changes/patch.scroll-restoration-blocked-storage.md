Fix `<ScrollRestoration>` throwing an uncaught error before hydration when `sessionStorage` is unavailable

- The inline restore script already logged the storage error, but its cleanup call accessed `sessionStorage` again and threw (e.g. Chrome with "Block all cookies", sandboxed cross-origin iframes)
- The error is still logged with `console.error`; only the second, uncaught throw is removed
