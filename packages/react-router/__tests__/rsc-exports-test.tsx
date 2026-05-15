import {
  unstable_useRoute,
  useRouteLoaderData,
} from "../index-react-server-client";
import * as ReactServerExports from "../index-react-server";

jest.mock(
  "react-router/internal/react-server-client",
  () => ({
    BrowserRouter: "BrowserRouter",
    Form: "Form",
    HashRouter: "HashRouter",
    Link: "Link",
    Links: "Links",
    MemoryRouter: "MemoryRouter",
    Meta: "Meta",
    Navigate: "Navigate",
    NavLink: "NavLink",
    Outlet: "Outlet",
    Route: "Route",
    Router: "Router",
    RouterProvider: "RouterProvider",
    Routes: "Routes",
    ScrollRestoration: "ScrollRestoration",
    StaticRouter: "StaticRouter",
    StaticRouterProvider: "StaticRouterProvider",
    UNSAFE_AwaitContextProvider: "UNSAFE_AwaitContextProvider",
    UNSAFE_WithComponentProps: "UNSAFE_WithComponentProps",
    UNSAFE_WithErrorBoundaryProps: "UNSAFE_WithErrorBoundaryProps",
    UNSAFE_WithHydrateFallbackProps: "UNSAFE_WithHydrateFallbackProps",
    unstable_HistoryRouter: "unstable_HistoryRouter",
    unstable_useRoute: "unstable_useRoute",
    useRouteLoaderData: "useRouteLoaderData",
  }),
  { virtual: true },
);

describe("RSC exports", () => {
  it("exposes route data hooks as client references", () => {
    expect(useRouteLoaderData).toBeDefined();
    expect(unstable_useRoute).toBeDefined();
  });

  it("re-exports route data hooks from the React Server entry", () => {
    expect(ReactServerExports.useRouteLoaderData).toBe("useRouteLoaderData");
    expect(ReactServerExports.unstable_useRoute).toBe("unstable_useRoute");
  });
});
