Allow client-side route middleware to return a callback that runs when leaving a route

- Supports Data mode `middleware` and Framework mode `clientMiddleware` returning an async/sync callback that is invoked when the route or layout that registered it is left during a later navigation.
