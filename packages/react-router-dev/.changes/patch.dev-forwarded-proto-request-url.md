Fix action submissions behind an HTTPS reverse proxy in `react-router dev` and `vite preview` by using `X-Forwarded-Proto` when constructing `request.url`.

No React Router configuration is required. The URL host continues to come from `Host`, not `X-Forwarded-Host`. Configure reverse proxies to overwrite client-supplied `X-Forwarded-Proto` headers, and do not expose dev or preview servers publicly.
