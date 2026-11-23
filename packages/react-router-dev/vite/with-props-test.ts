import { generate, parse } from "./babel";
import { decorateComponentExportsWithProps } from "./with-props";

test("avoids import name collisions with escaped identifiers", () => {
  let code = String.raw`
    const _\u0055NSAFE_withComponentProps = "Route content";

    export default function Route() {
      return _\u0055NSAFE_withComponentProps;
    }
  `;
  let ast = parse(code, { sourceType: "module" });
  decorateComponentExportsWithProps(ast);

  let output = parse(generate(ast).code, { sourceType: "module" });
  expect(output.program.body[0]).toMatchObject({
    type: "ImportDeclaration",
    source: { value: "react-router" },
    specifiers: [{ imported: { name: "UNSAFE_withComponentProps" } }],
  });
});
