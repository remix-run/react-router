Support arrays of objects for the `script:ld+json` meta descriptor

- Widen `"script:ld+json"` in `MetaDescriptor` from `LdJsonObject` to `LdJsonObject | LdJsonObject[]` so a route can declare multiple JSON-LD schemas (e.g. `Organization` + `BreadcrumbList`) in a single `<script type="application/ld+json">` tag emitted by `<Meta />`.
