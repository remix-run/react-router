Serialize the route pathnames used to resolve relative paths once per route instead of once per `useResolvedPath`/`useHref`/`useNavigate` call, which speeds up rendering pages with many `<Link>`s
