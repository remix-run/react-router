import { generate, parseRouteSource, t } from "./babel";
import { decorateComponentExportsWithProps } from "./with-props-external";

function decorate(code: string) {
  const ast = parseRouteSource(code, "route.tsx");
  decorateComponentExportsWithProps(ast);
  return ast;
}

describe("route component props", () => {
  test("keeps named components at module scope and local references intact", () => {
    const code = generate(
      decorate(`
      export default function Route() { return <Route />; }
      export function ErrorBoundary({error}) { return <p>{error.message}</p>; }
      export const handle = {}, HydrateFallback = () => <p>Loading...</p>;
    `),
    ).code;
    expect(code).toContain("function Route()");
    expect(code).toContain("<Route />");
    expect(code).toMatch(/withComponentProps\(Route\)/);
    expect(code).toMatch(/withErrorBoundaryProps\(ErrorBoundary\)/);
    expect(code.match(/withErrorBoundaryProps\d*\(/g)).toHaveLength(1);
    expect(code.match(/withHydrateFallbackProps\d*\(/g)).toHaveLength(1);
    expect(code).not.toContain("export { error");
  });

  test("gives anonymous components a unique uppercase name", () => {
    const ast = decorate(`const ReactRouterRouteComponent = "taken";
      export default () => <h1 />;`);
    expect(
      ast.program.body.some(
        (node) =>
          t.isVariableDeclaration(node) &&
          node.declarations.some(
            (declaration) =>
              t.isIdentifier(declaration.id, {
                name: "ReactRouterRouteComponent1",
              }) && t.isArrowFunctionExpression(declaration.init),
          ),
      ),
    ).toBe(true);
  });

  test("does not wrap type-only component exports", () => {
    const code = generate(
      decorate(`
      export interface ErrorBoundary { message: string }
      export type HydrateFallback = () => void;
    `),
    ).code;
    expect(code).not.toContain("withErrorBoundaryProps");
    expect(code).not.toContain("withHydrateFallbackProps");
  });

  test("leaves classes unchanged and wraps component re-exports", () => {
    const code = generate(
      decorate(`
      export default class Route {}
      export class ErrorBoundary {}
      export { Boundary as HydrateFallback } from "./boundary";
    `),
    ).code;
    expect(code).not.toContain("withComponentProps");
    expect(code).not.toContain("withErrorBoundaryProps");
    expect(code).toContain("withHydrateFallbackProps");
  });
});
