export type Exports = {
  type: string[];
  value: string[];
};

export type Adapter =
  | "architect"
  | "cloudflare-pages"
  | "cloudflare-workers"
  | "express"
  | "netlify"
  | "vercel";
export const adapters: Adapter[] = [
  "architect",
  "cloudflare-pages",
  "cloudflare-workers",
  "express",
  "netlify",
  "vercel",
];

export type Runtime = "cloudflare" | "node";
export const runtimes: Runtime[] = ["cloudflare", "node"];

export type Package = Adapter | Runtime | "react";

const defaultAdapterExports: Exports = {
  value: ["createRequestHandler"],
  type: ["GetLoadContextFunction", "RequestHandler"],
};
const defaultRuntimeExports: Exports = {
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
};

export const packageExports: Record<Package, Exports> = {
  architect: {
    value: [...defaultAdapterExports.value, "createArcTableSessionStorage"],
    type: [...defaultAdapterExports.type],
  },
  cloudflare: {
    value: [...defaultRuntimeExports.value, "createCloudflareKVSessionStorage"],
    type: [...defaultRuntimeExports.type],
  },
  "cloudflare-pages": {
    value: [...defaultAdapterExports.value, "createPagesFunctionHandler"],
    type: [...defaultAdapterExports.type, "createPagesFunctionHandlerParams"],
  },
  "cloudflare-workers": {
    value: [
      ...defaultAdapterExports.value,
      "createEventHandler",
      "handleAsset",
    ],
    type: [...defaultAdapterExports.type],
  },
  express: {
    value: [...defaultAdapterExports.value],
    type: [...defaultAdapterExports.type],
  },
  netlify: {
    value: [...defaultAdapterExports.value],
    type: [...defaultAdapterExports.type],
  },
  node: {
    value: [
      ...defaultRuntimeExports.value,
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
    type: [
      ...defaultRuntimeExports.type,
      "HeadersInit",
      "RequestInfo",
      "RequestInit",
      "ResponseInit",
    ],
  },
  react: {
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
      "ShouldReloadFunction",
      "SubmitFunction",
      "SubmitOptions",
      "ThrownResponse",
    ],
  },
  vercel: {
    value: [...defaultAdapterExports.value],
    type: [...defaultAdapterExports.type],
  },
};
