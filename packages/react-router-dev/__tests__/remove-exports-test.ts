import { generate, parse } from "../vite/babel";
import {
  removeExports,
  removeUnusedDotServerImports,
} from "../vite/remove-exports";

function removeClientOnlyRouteCode(code: string) {
  let ast = parse(code, { sourceType: "module" });
  removeExports(ast, ["loader", "action", "middleware", "headers"]);
  removeUnusedDotServerImports(ast);
  return generate(ast).code;
}

describe("removeUnusedDotServerImports", () => {
  it("removes unused .server directory imports", () => {
    let code = removeClientOnlyRouteCode(`
      import { serverOnly } from "../.server/utils";

      export default function Component() {
        return "Hello";
      }
    `);

    expect(code).not.toContain("../.server/utils");
    expect(code).not.toContain("serverOnly");
  });

  it("removes .server imports that become unused after server exports are removed", () => {
    let code = removeClientOnlyRouteCode(`
      import { serverOnly } from "../.server/utils";

      export const loader = () => serverOnly;

      export default function Component() {
        return "Hello";
      }
    `);

    expect(code).not.toContain("../.server/utils");
    expect(code).not.toContain("serverOnly");
  });

  it("keeps referenced .server directory imports", () => {
    let code = removeClientOnlyRouteCode(`
      import { serverOnly } from "../.server/utils";

      export default function Component() {
        return serverOnly;
      }
    `);

    expect(code).toContain("../.server/utils");
    expect(code).toContain("serverOnly");
  });
});
