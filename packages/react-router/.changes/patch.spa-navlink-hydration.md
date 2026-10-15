Update SPA hydration so `NavLink` active state matches the browser URL on deep links

- Hydrate against the URL the shell HTML was rendered for, then update to the current location so React applies attribute changes such as the active class
