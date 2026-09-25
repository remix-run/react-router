import dedent from "dedent";

import { generate, parse } from "../vite/babel";
import { decorateComponentExportsWithProps } from "../vite/with-props";

function transform(code: string) {
  let ast = parse(dedent(code), { sourceType: "module" });
  decorateComponentExportsWithProps(ast);
  return generate(ast).code;
}

describe("decorateComponentExportsWithProps", () => {
  it("wraps default function exports", () => {
    expect(
      transform(`
        export default function Component() {}
      `),
    ).toMatchInlineSnapshot(`
      "import { UNSAFE_withComponentProps as _UNSAFE_withComponentProps } from "react-router";
      export default _UNSAFE_withComponentProps(function Component() {});"
    `);
  });

  it("wraps default re-exports from another module", () => {
    expect(
      transform(`
        export { default } from "./component";
        export const loader = () => null;
      `),
    ).toMatchInlineSnapshot(`
      "import { UNSAFE_withComponentProps as _UNSAFE_withComponentProps } from "react-router";
      import _Component from "./component";
      const _default = _UNSAFE_withComponentProps(_Component);
      export { _default as default };
      export const loader = () => null;"
    `);
  });

  it("wraps named imports re-exported as default", () => {
    expect(
      transform(`
        export { Page as default } from "./component";
      `),
    ).toMatchInlineSnapshot(`
      "import { UNSAFE_withComponentProps as _UNSAFE_withComponentProps } from "react-router";
      import { Page as _Component } from "./component";
      const _default = _UNSAFE_withComponentProps(_Component);
      export { _default as default };"
    `);
  });

  it("wraps local bindings exported as default", () => {
    expect(
      transform(`
        function Page() {}
        export { Page as default };
      `),
    ).toMatchInlineSnapshot(`
      "import { UNSAFE_withComponentProps as _UNSAFE_withComponentProps } from "react-router";
      function Page() {}
      const _default = _UNSAFE_withComponentProps(Page);
      export { _default as default };"
    `);
  });

  it("wraps re-exported ErrorBoundary and HydrateFallback and keeps other specifiers", () => {
    expect(
      transform(`
        export { ErrorBoundary, HydrateFallback, loader } from "./route";
      `),
    ).toMatchInlineSnapshot(`
      "import { UNSAFE_withErrorBoundaryProps as _UNSAFE_withErrorBoundaryProps, UNSAFE_withHydrateFallbackProps as _UNSAFE_withHydrateFallbackProps } from "react-router";
      export { loader } from "./route";
      import { ErrorBoundary as _ErrorBoundary } from "./route";
      const _ErrorBoundary2 = _UNSAFE_withErrorBoundaryProps(_ErrorBoundary);
      export { _ErrorBoundary2 as ErrorBoundary };
      import { HydrateFallback as _HydrateFallback } from "./route";
      const _HydrateFallback2 = _UNSAFE_withHydrateFallbackProps(_HydrateFallback);
      export { _HydrateFallback2 as HydrateFallback };"
    `);
  });

  it("leaves unrelated export specifiers untouched", () => {
    expect(
      transform(`
        export { loader, meta } from "./route";
      `),
    ).toMatchInlineSnapshot(`"export { loader, meta } from "./route";"`);
  });

  it("leaves re-exports from route chunk modules untouched", () => {
    expect(
      transform(`
        export { default } from "./route.tsx?route-chunk=main";
        export { HydrateFallback } from "./route.tsx?route-chunk=HydrateFallback";
      `),
    ).toMatchInlineSnapshot(`
     "export { default } from "./route.tsx?route-chunk=main";
     export { HydrateFallback } from "./route.tsx?route-chunk=HydrateFallback";"
    `);
  });
});
