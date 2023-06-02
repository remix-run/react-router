import type { Adapter, Renderer, Runtime } from "./remix";

export type Export<Source extends string = string> = {
  source: Source;
  kind: "type" | "value" | "typeof";
  name: string;
  alias?: string;
};

const exportsFromNames = <Source extends string = string>(
  source: Source,
  names: {
    type: readonly string[];
    value: readonly string[];
  }
): Export<Source>[] => {
  return [
    ...names.type.map(
      (name) =>
        ({
          source,
          kind: "type",
          name,
        } as const)
    ),
    ...names.value.map(
      (name) =>
        ({
          source,
          kind: "value",
          name,
        } as const)
    ),
  ];
};

type ExportNames = {
  type: string[];
  value: string[];
};

// Runtimes

const defaultRuntimeExports: ExportNames = {
  type: [
    "ActionFunction",
    "AppData",
    "AppLoadContext",
    "Cookie",
    "CookieOptions",
    "CookieParseOptions",
    "CookieSerializeOptions",
    "CookieSignatureOptions",
    "CreateRequestHandlerFunction",
    "DataFunctionArgs",
    "EntryContext",
    "ErrorBoundaryComponent",
    "HandleDataRequestFunction",
    "HandleDocumentRequestFunction",
    "HeadersArgs",
    "HeadersFunction",
    "HtmlLinkDescriptor",
    "HtmlMetaDescriptor",
    "LinkDescriptor",
    "LinksFunction",
    "LoaderFunction",
    "MemoryUploadHandlerFilterArgs",
    "MemoryUploadHandlerOptions",
    "MetaDescriptor",
    "MetaFunction",
    "HandleErrorFunction",
    "PageLinkDescriptor",
    "RequestHandler",
    "RouteComponent",
    "RouteHandle",
    "ServerBuild",
    "ServerEntryModule",
    "Session",
    "SessionData",
    "SessionIdStorageStrategy",
    "SessionStorage",
    "UploadHandler",
    "UploadHandlerPart",
  ],
  value: [
    "createCookie",
    "createCookieSessionStorage",
    "createMemorySessionStorage",
    "createRequestHandler",
    "createSession",
    "createSessionStorage",
    "isCookie",
    "isSession",
    "json",
    "MaxPartSizeExceededError",
    "redirect",
    "unstable_composeUploadHandlers",
    "unstable_createMemoryUploadHandler",
    "unstable_parseMultipartFormData",
  ],
};

const exportNamesByRuntime: Record<Runtime, Partial<ExportNames>> = {
  cloudflare: {
    value: [
      "createCloudflareKVSessionStorage",
      "createWorkersKVSessionStorage",
    ],
  },
  node: {
    type: ["HeadersInit", "RequestInfo", "RequestInit", "ResponseInit"],
    value: [
      "AbortController",
      "createFileSessionStorage",
      "createReadableStreamFromReadable",
      "fetch",
      "FormData",
      "Headers",
      "installGlobals",
      "NodeOnDiskFile",
      "readableStreamToString",
      "Request",
      "Response",
      "unstable_createFileUploadHandler",
      "writeAsyncIterableToWritable",
      "writeReadableStreamToWritable",
    ],
  },
};

export const getRuntimeExports = (runtime: Runtime) => {
  let names = exportNamesByRuntime[runtime];
  return exportsFromNames(`@remix-run/${runtime}`, {
    type: [...defaultRuntimeExports.type, ...(names.type ?? [])],
    value: [...defaultRuntimeExports.value, ...(names.value ?? [])],
  });
};

// Adapters

const defaultAdapterExports: ExportNames = {
  type: ["GetLoadContextFunction", "RequestHandler"],
  value: ["createRequestHandler"],
};

const exportNamesByAdapter: Record<Adapter, Partial<ExportNames>> = {
  architect: {
    value: ["createArcTableSessionStorage"],
  },
  "cloudflare-pages": {
    type: ["createPagesFunctionHandlerParams"],
    value: ["createPagesFunctionHandler"],
  },
  "cloudflare-workers": {
    value: ["createEventHandler", "handleAsset"],
  },
  express: {},
  netlify: {},
  vercel: {},
};

export const getAdapterExports = (adapter: Adapter) => {
  let names = exportNamesByAdapter[adapter];
  return exportsFromNames(`@remix-run/${adapter}`, {
    type: [...defaultAdapterExports.type, ...(names.type ?? [])],
    value: [...defaultAdapterExports.value, ...(names.value ?? [])],
  });
};

// Renderers

const exportsByRenderer: Record<Renderer, Partial<ExportNames>> = {
  react: {
    type: [
      "FormEncType",
      "FormMethod",
      "FormProps",
      "HtmlLinkDescriptor",
      "HtmlMetaDescriptor",
      "LinkProps",
      "NavLinkProps",
      "RemixBrowserProps",
      "RemixServerProps",
      "SubmitFunction",
      "SubmitOptions",
      "ThrownResponse",
    ],
    value: [
      "Form",
      "Link",
      "Links",
      "LiveReload",
      "Meta",
      "NavLink",
      "Outlet",
      "PrefetchPageLinks",
      "RemixBrowser",
      "RemixServer",
      "Scripts",
      "ScrollRestoration",
      "useActionData",
      "useBeforeUnload",
      "useCatch",
      "useFetcher",
      "useFetchers",
      "useFormAction",
      "useHref",
      "useLoaderData",
      "useLocation",
      "useMatches",
      "useNavigate",
      "useNavigationType",
      "useOutlet",
      "useOutletContext",
      "useParams",
      "useResolvedPath",
      "useSearchParams",
      "useSubmit",
      "useTransition",
    ],
  },
};

export const getRendererExports = (renderer: Renderer) => {
  let names = exportsByRenderer[renderer];
  return exportsFromNames(`@remix-run/${renderer}`, {
    type: names.type ?? [],
    value: names.value ?? [],
  });
};
