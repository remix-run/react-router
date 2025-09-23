import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import type {
  DataRouteObject,
  DataRouter,
  RouterNavigateOptions,
} from "react-router";
import { HydratedRouter } from "react-router/dom";
import { getPattern, measure, startMeasure } from "./o11y";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter
        unstable_instrumentRoute={instrumentRoute}
        unstable_instrumentRouter={instrumentRouter}
      />
    </StrictMode>,
  );
});

function instrumentRouter(router: DataRouter) {
  let initialize = router.initialize;
  router.initialize = () => {
    let pattern = getPattern(router.routes, router.state.location.pathname);
    let end = startMeasure(["initialize", pattern]);

    if (router.state.initialized) {
      end();
    } else {
      let unsubscribe = router.subscribe((state) => {
        if (state.initialized) {
          end();
          unsubscribe();
        }
      });
    }
    return initialize();
  };

  let navigate = router.navigate;
  router.navigate = async (to, opts?: RouterNavigateOptions) => {
    let path =
      typeof to === "string"
        ? to
        : typeof to === "number"
          ? String(to)
          : (to?.pathname ?? "unknown");
    await measure([`navigate`, getPattern(router.routes, path)], () =>
      typeof to === "number" ? navigate(to) : navigate(to, opts),
    );
  };

  return router;
}

function instrumentRoute(route: DataRouteObject): DataRouteObject {
  if (typeof route.lazy === "function") {
    let lazy = route.lazy;
    route.lazy = () => measure(["lazy", route.id], () => lazy());
  }

  if (
    route.middleware &&
    route.middleware.length > 0 &&
    // @ts-expect-error
    route.middleware.instrumented !== true
  ) {
    route.middleware = route.middleware.map((mw, i) => {
      return ({ request, params, pattern, context }, next) =>
        measure(["middleware", route.id, i.toString(), pattern], async () =>
          mw({ request, params, pattern, context }, next),
        );
    });
    // When `route.lazy` is used alongside a statically defined `loader`, make
    // sure we don't double-instrument the `loader` after `route.lazy` completes
    // and we re-call `instrumentRoute` via `mapRouteProperties`
    // @ts-expect-error
    route.middleware.instrumented = true;
  }

  // @ts-expect-error
  if (typeof route.loader === "function" && !route.loader.instrumented) {
    let loader = route.loader;
    route.loader = (...args) => {
      return measure([`loader:${route.id}`, args[0].pattern], async () =>
        loader(...args),
      );
    };
    // When `route.lazy` is used alongside a statically defined `loader`, make
    // sure we don't double-instrument the `loader` after `route.lazy` completes
    // and we re-call `instrumentRoute` via `mapRouteProperties`
    // @ts-expect-error
    route.loader.instrumented = true;
  }

  return route;
}
