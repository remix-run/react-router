import * as assert from "node:assert";

import { virtualRouteModulesPlugin } from "../vite/rsc/virtual-route-modules";

const plugin = virtualRouteModulesPlugin({
  isRouteModule() {
    return true;
  },
});

const js = String.raw;

const fullClientModule = js`
  import "./side-effect.css";
  import { client } from "./client";
  import { server } from "./server";
  import { shared } from "./shared";
  export function loader() { console.log(server, shared); }
  export function action() { console.log(server, shared); }
  export function headers() { console.log(server, shared); }
  export function clientLoader() { console.log(client, shared); }
  export function clientAction() { console.log(client, shared); }
  export function links() { console.log(client, shared); }
  export function meta() { console.log(client, shared); }
  export default function Route() { console.log(client, shared); }
  export function Layout() { console.log(client, shared); }
  export function ErrorBoundary() { console.log(client, shared); }
  export function HydrateFallback() { console.log(client, shared); }
`;

const fullServerModule = js`
  import "./side-effect.css";
  import { client } from "./client";
  import { server } from "./server";
  import { shared } from "./shared";
  export function loader() { console.log(server, shared); }
  export function action() { console.log(server, shared); }
  export function headers() { console.log(server, shared); }
  export function clientLoader() { console.log(client, shared); }
  export function clientAction() { console.log(client, shared); }
  export function links() { console.log(client, shared); }
  export function meta() { console.log(client, shared); }
  export function ServerComponent() { console.log(server, shared); }
  export function ServerLayout() { console.log(server, shared); }
  export function ServerErrorBoundary() { console.log(server, shared); }
  export function ServerHydrateFallback() { console.log(server, shared); }
`;

const mixedModule = js`
  import "./side-effect.css";
  import { client } from "./client";
  import { server } from "./server";
  import { shared } from "./shared";
  export function loader() { console.log(server, shared); }
  export function action() { console.log(server, shared); }
  export function headers() { console.log(server, shared); }
  export function clientLoader() { console.log(client, shared); }
  export function clientAction() { console.log(client, shared); }
  export function links() { console.log(client, shared); }
  export function meta() { console.log(client, shared); }
  export function ServerComponent() { console.log(server, shared); }
  export function Layout() { console.log(client, shared); }
  export function ErrorBoundary() { console.log(client, shared); }
  export function HydrateFallback() { console.log(client, shared); }
`;

const unsplittableModule = js`
  import "./side-effect.css";
  import { client } from "./client";
  import { server } from "./server";
  import { shared } from "./shared";
  export const test = "test";
  export function loader() { console.log(server, shared); }
  export function action() { console.log(server, shared); }
  export function headers() { console.log(server, shared); }
  export function clientLoader() { console.log(client, shared, test); }
  export function clientAction() { console.log(client, shared, test); }
  export function links() { console.log(client, shared); }
  export function meta() { console.log(client, shared); }
  export default function Route() { console.log(client, shared); }
  export function Layout() { console.log(client, shared); }
  export function ErrorBoundary() { console.log(client, shared); }
  export function HydrateFallback() { console.log(client, shared, test); }
`;

const transform = plugin.transform.handler.bind({
  environment: { name: "rsc" },
} as any);

describe("route entry", () => {
  describe("client environment", () => {
    const transform = plugin.transform.handler.bind({
      environment: { name: "client" },
    } as any);

    it("transforms full client modules", async () => {
      const transformed = await transform(fullClientModule, "/test.js");
      assert.ok(transformed);
      expect(transformed.code).toBe(
        [
          '"use client";',
          'import * as React from "react";',
          'export const clientLoader = async (...args) => import("/test.js?client-route-module=clientLoader").then(mod => mod.clientLoader(...args));',
          'export const clientAction = async (...args) => import("/test.js?client-route-module=clientAction").then(mod => mod.clientAction(...args));',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";',
          'export { default } from "/test.js?client-route-module=shared";',
          'export { Layout } from "/test.js?client-route-module=shared";',
          'export { ErrorBoundary } from "/test.js?client-route-module=shared";',
          'export const HydrateFallback = React.lazy(() => import("/test.js?client-route-module=HydrateFallback").then(mod => ({ default: mod.HydrateFallback })));\n',
        ].join("\n"),
      );
    });

    it("transforms full server modules", async () => {
      const transformed = await transform(fullServerModule, "/test.js");
      assert.ok(transformed);
      expect(transformed.code).toBe(
        [
          '"use client";',
          'export const clientLoader = async (...args) => import("/test.js?client-route-module=clientLoader").then(mod => mod.clientLoader(...args));',
          'export const clientAction = async (...args) => import("/test.js?client-route-module=clientAction").then(mod => mod.clientAction(...args));',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";\n',
        ].join("\n"),
      );
    });

    it("transforms mixed modules", async () => {
      const transformed = await transform(mixedModule, "/test.js");
      assert.ok(transformed);
      expect(transformed.code).toBe(
        [
          '"use client";',
          'import * as React from "react";',
          'export const clientLoader = async (...args) => import("/test.js?client-route-module=clientLoader").then(mod => mod.clientLoader(...args));',
          'export const clientAction = async (...args) => import("/test.js?client-route-module=clientAction").then(mod => mod.clientAction(...args));',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";',
          'export { Layout } from "/test.js?client-route-module=shared";',
          'export { ErrorBoundary } from "/test.js?client-route-module=shared";',
          'export const HydrateFallback = React.lazy(() => import("/test.js?client-route-module=HydrateFallback").then(mod => ({ default: mod.HydrateFallback })));\n',
        ].join("\n"),
      );
    });

    it("transforms unsplittable modules", async () => {
      const transformed = await transform(unsplittableModule, "/test.js");
      assert.ok(transformed);
      expect(transformed.code).toBe(
        [
          '"use client";',
          'import * as React from "react";',
          'export { test } from "/test.js?client-route-module=shared";',
          'export { clientLoader } from "/test.js?client-route-module=shared";',
          'export { clientAction } from "/test.js?client-route-module=shared";',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";',
          'export { default } from "/test.js?client-route-module=shared";',
          'export { Layout } from "/test.js?client-route-module=shared";',
          'export { ErrorBoundary } from "/test.js?client-route-module=shared";',
          'export const HydrateFallback = React.lazy(() => import("/test.js?client-route-module=shared").then(mod => ({ default: mod.HydrateFallback })));\n',
        ].join("\n"),
      );
    });
  });

  describe("server environment", () => {
    function withCss(name: string) {
      return [
        `import { ${name} as ${name}WithoutCss } from "/test.js?server-route-module=";`,
        `export function ${name}(props) {`,
        `  return React.createElement(React.Fragment, null,`,
        `    import.meta.viteRsc.loadCss(),`,
        `    React.createElement(${name}WithoutCss, props),`,
        `  );`,
        `}`,
      ];
    }

    it("transforms full client modules", async () => {
      const transformed = await transform(fullClientModule, "/test.js");
      assert.ok(transformed);
      expect(transformed.code).toBe(
        [
          'export { loader } from "/test.js?server-route-module=";',
          'export { action } from "/test.js?server-route-module=";',
          'export { headers } from "/test.js?server-route-module=";',
          'export { clientLoader } from "/test.js?client-route-module=clientLoader";',
          'export { clientAction } from "/test.js?client-route-module=clientAction";',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";',
          'export { default } from "/test.js?client-route-module=shared";',
          'export { Layout } from "/test.js?client-route-module=shared";',
          'export { ErrorBoundary } from "/test.js?client-route-module=shared";',
          'export { HydrateFallback } from "/test.js?client-route-module=HydrateFallback";\n',
        ].join("\n"),
      );
    });

    it("transforms full server modules", async () => {
      const transformed = await transform(fullServerModule, "/test.js");
      assert.ok(transformed);

      expect(transformed.code).toBe(
        [
          'export { loader } from "/test.js?server-route-module=";',
          'export { action } from "/test.js?server-route-module=";',
          'export { headers } from "/test.js?server-route-module=";',
          'export { clientLoader } from "/test.js?client-route-module=clientLoader";',
          'export { clientAction } from "/test.js?client-route-module=clientAction";',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";',
          ...withCss("ServerComponent"),
          ...withCss("ServerLayout"),
          ...withCss("ServerErrorBoundary"),
          ...withCss("ServerHydrateFallback"),
        ].join("\n") + "\n",
      );
    });

    it("transforms mixed modules", async () => {
      const transformed = await transform(mixedModule, "/test.js");
      assert.ok(transformed);
      expect(transformed.code).toBe(
        [
          'export { loader } from "/test.js?server-route-module=";',
          'export { action } from "/test.js?server-route-module=";',
          'export { headers } from "/test.js?server-route-module=";',
          'export { clientLoader } from "/test.js?client-route-module=clientLoader";',
          'export { clientAction } from "/test.js?client-route-module=clientAction";',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";',
          ...withCss("ServerComponent"),
          'export { Layout } from "/test.js?client-route-module=shared";',
          'export { ErrorBoundary } from "/test.js?client-route-module=shared";',
          'export { HydrateFallback } from "/test.js?client-route-module=HydrateFallback";',
        ].join("\n") + "\n",
      );
    });

    it("transforms unsplittable modules", async () => {
      const transformed = await transform(unsplittableModule, "/test.js");
      assert.ok(transformed);
      expect(transformed.code).toBe(
        [
          'export { test } from "/test.js?server-route-module=";',
          'export { loader } from "/test.js?server-route-module=";',
          'export { action } from "/test.js?server-route-module=";',
          'export { headers } from "/test.js?server-route-module=";',
          'export { clientLoader } from "/test.js?client-route-module=shared";',
          'export { clientAction } from "/test.js?client-route-module=shared";',
          'export { links } from "/test.js?client-route-module=shared";',
          'export { meta } from "/test.js?client-route-module=shared";',
          'export { default } from "/test.js?client-route-module=shared";',
          'export { Layout } from "/test.js?client-route-module=shared";',
          'export { ErrorBoundary } from "/test.js?client-route-module=shared";',
          'export { HydrateFallback } from "/test.js?client-route-module=shared";\n',
        ].join("\n"),
      );
    });
  });
});

describe("server-route-module", () => {
  it("transforms full client modules", async () => {
    const transformed = await transform(
      fullClientModule,
      "/test.js?server-route-module=",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        'import "./side-effect.css";',
        'import { server } from "./server";',
        'import { shared } from "./shared";',
        "export function loader() {\n  console.log(server, shared);\n}",
        "export function action() {\n  console.log(server, shared);\n}",
        "export function headers() {\n  console.log(server, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms full server modules", async () => {
    const transformed = await transform(
      fullServerModule,
      "/test.js?server-route-module=",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        'import "./side-effect.css";',
        'import { server } from "./server";',
        'import { shared } from "./shared";',
        "export function loader() {\n  console.log(server, shared);\n}",
        "export function action() {\n  console.log(server, shared);\n}",
        "export function headers() {\n  console.log(server, shared);\n}",
        "export function ServerComponent() {\n  console.log(server, shared);\n}",
        "export function ServerLayout() {\n  console.log(server, shared);\n}",
        "export function ServerErrorBoundary() {\n  console.log(server, shared);\n}",
        "export function ServerHydrateFallback() {\n  console.log(server, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms mixed modules", async () => {
    const transformed = await transform(
      mixedModule,
      "/test.js?server-route-module=",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        'import "./side-effect.css";',
        'import { server } from "./server";',
        'import { shared } from "./shared";',
        "export function loader() {\n  console.log(server, shared);\n}",
        "export function action() {\n  console.log(server, shared);\n}",
        "export function headers() {\n  console.log(server, shared);\n}",
        "export function ServerComponent() {\n  console.log(server, shared);\n}",
      ].join("\n"),
    );
  });
});

describe("client-route-module=shared", () => {
  it("transforms full client modules", async () => {
    const transformed = await transform(
      fullClientModule,
      "/test.js?client-route-module=shared",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function links() {\n  console.log(client, shared);\n}",
        "export function meta() {\n  console.log(client, shared);\n}",
        "export default function Route() {\n  console.log(client, shared);\n}",
        "export function Layout() {\n  console.log(client, shared);\n}",
        "export function ErrorBoundary() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms full server modules", async () => {
    const transformed = await transform(
      fullServerModule,
      "/test.js?client-route-module=shared",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function links() {\n  console.log(client, shared);\n}",
        "export function meta() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms mixed modules", async () => {
    const transformed = await transform(
      mixedModule,
      "/test.js?client-route-module=shared",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function links() {\n  console.log(client, shared);\n}",
        "export function meta() {\n  console.log(client, shared);\n}",
        "export function Layout() {\n  console.log(client, shared);\n}",
        "export function ErrorBoundary() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms unsplittable modules", async () => {
    const transformed = await transform(
      unsplittableModule,
      "/test.js?client-route-module=shared",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        'export const test = "test";',
        "export function clientLoader() {\n  console.log(client, shared, test);\n}",
        "export function clientAction() {\n  console.log(client, shared, test);\n}",
        "export function links() {\n  console.log(client, shared);\n}",
        "export function meta() {\n  console.log(client, shared);\n}",
        "export default function Route() {\n  console.log(client, shared);\n}",
        "export function Layout() {\n  console.log(client, shared);\n}",
        "export function ErrorBoundary() {\n  console.log(client, shared);\n}",
        "export function HydrateFallback() {\n  console.log(client, shared, test);\n}",
      ].join("\n"),
    );
  });
});

describe("client-route-module=clientLoader", () => {
  it("transforms full client modules", async () => {
    const transformed = await transform(
      fullClientModule,
      "/test.js?client-route-module=clientLoader",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function clientLoader() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms full server modules", async () => {
    const transformed = await transform(
      fullServerModule,
      "/test.js?client-route-module=clientLoader",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function clientLoader() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms mixed modules", async () => {
    const transformed = await transform(
      mixedModule,
      "/test.js?client-route-module=clientLoader",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function clientLoader() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });
});

describe("client-route-module=clientAction", () => {
  it("transforms full client modules", async () => {
    const transformed = await transform(
      fullClientModule,
      "/test.js?client-route-module=clientAction",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function clientAction() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms full server modules", async () => {
    const transformed = await transform(
      fullServerModule,
      "/test.js?client-route-module=clientAction",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function clientAction() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms mixed modules", async () => {
    const transformed = await transform(
      mixedModule,
      "/test.js?client-route-module=clientAction",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function clientAction() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });
});

describe("client-route-module=HydrateFallback", () => {
  it("transforms full client modules", async () => {
    const transformed = await transform(
      fullClientModule,
      "/test.js?client-route-module=HydrateFallback",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function HydrateFallback() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });

  it("transforms mixed modules", async () => {
    const transformed = await transform(
      mixedModule,
      "/test.js?client-route-module=HydrateFallback",
    );
    assert.ok(transformed);
    expect(transformed.code).toBe(
      [
        '"use client";',
        'import "./side-effect.css";',
        'import { client } from "./client";',
        'import { shared } from "./shared";',
        "export function HydrateFallback() {\n  console.log(client, shared);\n}",
      ].join("\n"),
    );
  });
});
