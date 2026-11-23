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

  let output = generate(ast).code;
  expect(() => parse(output, { sourceType: "module" })).not.toThrow();
});
