import type {
  EntryContext,
  FrameworkContextObject,
} from "../../lib/dom/ssr/entry";

export function mockFrameworkContext(
  overrides?: Partial<FrameworkContextObject>
): FrameworkContextObject {
  return {
    routeModules: { root: { default: () => null } },
    manifest: {
      routes: {
        root: {
          id: "root",
          module: "root.js",
          hasClientMiddleware: false,
          hasLoader: false,
          hasClientLoader: false,
          hasAction: false,
          hasClientAction: false,
          hasErrorBoundary: false,
          clientActionModule: undefined,
          clientLoaderModule: undefined,
          clientMiddlewareModule: undefined,
          hydrateFallbackModule: undefined,
        },
      },
      entry: { imports: [], module: "" },
      url: "",
      version: "",
    },
    future: {
      unstable_middleware: false,
      unstable_subResourceIntegrity: false,
    },
    ssr: true,
    isSpaMode: false,
    routeDiscovery: {
      mode: "lazy",
      manifestPath: "/__manifest",
    },
    ...overrides,
  };
}

export function mockEntryContext(
  overrides?: Partial<EntryContext>
): EntryContext {
  return {
    ...mockFrameworkContext(overrides),
    staticHandlerContext: {
      location: {
        pathname: "/",
        search: "",
        hash: "",
        state: null,
        key: "default",
      },
      basename: "",
      loaderData: {},
      actionData: null,
      errors: null,
      matches: [],
      statusCode: 200,
      actionHeaders: {},
      loaderHeaders: {},
    },
    serverHandoffStream: undefined,
    ...overrides,
  };
}
