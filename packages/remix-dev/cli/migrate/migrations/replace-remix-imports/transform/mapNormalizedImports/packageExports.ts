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
    "createSessionStorage",
    "createRequestHandler",
    "createSession",
    "isCookie",
    "isSession",
    "json",
    "redirect",
  ],
  type: [
    "ActionFunction",
    "AppData",
    "AppLoadContext",
    "CreateRequestHandlerFunction",
    "Cookie",
    "CookieOptions",
    "CookieParseOptions",
    "CookieSerializeOptions",
    "CookieSignatureOptions",
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
      "fetch",
      "FormData",
      "Headers",
      "NodeOnDiskFile",
      "Request",
      "Response",
      "unstable_createFileUploadHandler",
      "unstable_createMemoryUploadHandler",
      "unstable_parseMultipartFormData",
    ],
    type: [
      ...defaultRuntimeExports.type,
      "HeadersInit",
      "RequestInfo",
      "RequestInit",
      "ResponseInit",
      "UploadHandler",
      "UploadHandlerArgs",
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
