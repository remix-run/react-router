---
title: Revalidation Optimization
hidden: true
---

[copy pasted]

During client-side transitions, React Router will optimize reloading of routes that are already rendering, like not reloading layout routes that aren't changing. In other cases, like form submissions or search param changes, React Router doesn't know which routes need to be reloaded, so it reloads them all to be safe. This ensures your UI always stays in sync with the state on your server.

This function lets apps further optimize by returning `false` when React Router is about to reload a route. If you define this function on a route module, React Router will defer to your function on every navigation and every revalidation after an action is called. Again, this makes it possible for your UI to get out of sync with your server if you do it wrong, so be careful.

`fetcher.load` calls also revalidate, but because they load a specific URL, they don't have to worry about route param or URL search param revalidations. `fetcher.load`'s only revalidate by default after action submissions and explicit revalidation requests via [`useRevalidator`][use-revalidator].
