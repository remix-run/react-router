import { defineRoute } from "./define-route";

// TODO: make sure tsc fails when there are type errors in this file

// prettier-ignore
type Equal<X, Y> =
  (<T>() => T extends X ? 1 : 2) extends
  (<T>() => T extends Y ? 1 : 2) ? true : false
function expectEqual<T, U>(_: Equal<T, U>) {}

// Infer params
type Params = {
  [key: string]: string | undefined;
  id: string;
  brand?: string;
};
defineRoute({
  params: ["id", "brand?"],
  links({ params }) {
    expectEqual<typeof params, Params>(true);
    return [];
  },
  HydrateFallback({ params }) {
    expectEqual<typeof params, Params>(true);
    return null;
  },
  serverLoader({ params }) {
    expectEqual<typeof params, Params>(true);
    return null;
  },
  clientLoader({ params }) {
    expectEqual<typeof params, Params>(true);
    return null;
  },
  serverAction({ params }) {
    expectEqual<typeof params, Params>(true);
    return null;
  },
  clientAction({ params }) {
    expectEqual<typeof params, Params>(true);
    return null;
  },
  meta({ params }) {
    expectEqual<typeof params, Params>(true);
    return [];
  },
  Component({ params }) {
    expectEqual<typeof params, Params>(true);
    return null;
  },
  ErrorBoundary({ params }) {
    expectEqual<typeof params, Params>(true);
    return null;
  },
});

// Loader data: no loaders -> undefined
defineRoute({
  meta({ loaderData }) {
    expectEqual<typeof loaderData, undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, undefined>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, undefined>(true);
    return null;
  },
});

// Loader data: server -> server
defineRoute({
  serverLoader() {
    return 1;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 1 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 1>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 1 | undefined>(true);
    return null;
  },
});

// Loader data: server + client -> server | client
defineRoute({
  serverLoader() {
    return 1;
  },
  async clientLoader({ serverLoader }) {
    let serverData = await serverLoader();
    expectEqual<typeof serverData, 1>(true);
    return 2 as const;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return null;
  },
});

// Loader data: server + client + hydrate -> server | client
defineRoute({
  serverLoader() {
    return 1;
  },
  async clientLoader({ serverLoader }) {
    let serverData = await serverLoader();
    expectEqual<typeof serverData, 1>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 1 | 2 | undefined>(true);
    return null;
  },
});

// Loader data: server + client + hydrate + hydratefallback -> client
defineRoute({
  serverLoader() {
    return 1;
  },
  async clientLoader({ serverLoader }) {
    let serverData = await serverLoader();
    expectEqual<typeof serverData, 1>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  HydrateFallback() {
    return null;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return null;
  },
});

// Loader data: client + hydrate + hydratefallback -> client
defineRoute({
  async clientLoader({ serverLoader }) {
    expectEqual<typeof serverLoader, undefined>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  HydrateFallback() {
    return null;
  },
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return null;
  },
});

// Loader data: client + hydrate + -> client
defineRoute({
  async clientLoader({ serverLoader }) {
    expectEqual<typeof serverLoader, undefined>(true);
    return 2 as const;
  },
  clientLoaderHydrate: true,
  meta({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return [];
  },
  Component({ loaderData }) {
    expectEqual<typeof loaderData, 2>(true);
    return null;
  },
  ErrorBoundary({ loaderData }) {
    expectEqual<typeof loaderData, 2 | undefined>(true);
    return null;
  },
});

// action: neither, server, client, both

// Action data: no actions -> undefined
defineRoute({
  Component({ actionData }) {
    expectEqual<typeof actionData, undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, undefined>(true);
    return null;
  },
});

// Action data: server -> server
defineRoute({
  serverAction() {
    return 1;
  },
  Component({ actionData }) {
    expectEqual<typeof actionData, 1 | undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, 1 | undefined>(true);
    return null;
  },
});

// Action data: client -> client
defineRoute({
  clientAction({ serverAction }) {
    expectEqual<typeof serverAction, undefined>(true);
    return 2;
  },
  Component({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
});

// TODO: should it be `server | client` instead?
// Action data: server + client -> client
defineRoute({
  serverAction() {
    return 1;
  },
  clientAction() {
    return 2;
  },
  Component({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
  ErrorBoundary({ actionData }) {
    expectEqual<typeof actionData, 2 | undefined>(true);
    return null;
  },
});
