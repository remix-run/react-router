import dedent from "dedent";

import { addSuffixToCssSideEffectImports } from "../compiler/plugins/cssSideEffectImports";

describe("addSuffixToCssSideEffectImports", () => {
  describe("adds suffix", () => {
    test("side-effect require", () => {
      let code = dedent`
        require("./foo.css");
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"require("./foo.css?__remix_sideEffect__");"`
      );
    });

    test("side-effect import", () => {
      let code = dedent`
        import "./foo.css";
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"import "./foo.css?__remix_sideEffect__";"`
      );
    });

    test("side-effect import with JSX", () => {
      let code = dedent`
        import "./foo.css";
        
        export const Foo = () => <div />;
      `;

      expect(addSuffixToCssSideEffectImports("jsx", code))
        .toMatchInlineSnapshot(`
        "import "./foo.css?__remix_sideEffect__";

        export const Foo = () => <div />;"
      `);
    });

    test("side-effect import in TypeScript", () => {
      let code = dedent`
        require("./foo.css");
        
        export const foo: string = 'foo' satisfies string;
      `;

      expect(addSuffixToCssSideEffectImports("ts", code))
        .toMatchInlineSnapshot(`
        "require("./foo.css?__remix_sideEffect__");

        export const foo: string = ('foo' satisfies string);"
      `);
    });

    test("side-effect import in TypeScript with JSX", () => {
      let code = dedent`
        require("./foo.css");
        
        export const foo: string = 'foo' satisfies string;
        export const Bar = () => <div>{foo}</div>;
      `;

      expect(addSuffixToCssSideEffectImports("tsx", code))
        .toMatchInlineSnapshot(`
        "require("./foo.css?__remix_sideEffect__");

        export const foo: string = ('foo' satisfies string);
        export const Bar = () => <div>{foo}</div>;"
      `);
    });

    test("conditional side-effect require", () => {
      let code = dedent`
        if (process.env.NODE_ENV === "production") {
          require("./foo.min.css");
        } else {
          require("./foo.css");
        }
      `;

      expect(addSuffixToCssSideEffectImports("js", code))
        .toMatchInlineSnapshot(`
        "if (process.env.NODE_ENV === "production") {
          require("./foo.min.css?__remix_sideEffect__");
        } else {
          require("./foo.css?__remix_sideEffect__");
        }"
      `);
    });

    test("conditional side-effect require via ternary", () => {
      let code = dedent`
        process.env.NODE_ENV === "production" ? require("./foo.min.css") : require("./foo.css");
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"process.env.NODE_ENV === "production" ? require("./foo.min.css?__remix_sideEffect__") : require("./foo.css?__remix_sideEffect__");"`
      );
    });

    test("conditional side-effect require via && operator", () => {
      let code = dedent`
        process.env.NODE_ENV === "development" && require("./debug.css");
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"process.env.NODE_ENV === "development" && require("./debug.css?__remix_sideEffect__");"`
      );
    });

    test("conditional side-effect require via || operator", () => {
      let code = dedent`
        process.env.NODE_ENV === "production" || require("./debug.css");
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"process.env.NODE_ENV === "production" || require("./debug.css?__remix_sideEffect__");"`
      );
    });
  });

  describe("doesn't add suffix", () => {
    test("ignores non side-effect require of CSS", () => {
      let code = dedent`
        const href = require("./foo.css");
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"const href = require("./foo.css");"`
      );
    });

    test("ignores default import of CSS", () => {
      let code = dedent`
        import href from "./foo.css";
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"import href from "./foo.css";"`
      );
    });

    test("ignores named import of CSS", () => {
      let code = dedent`
        import { foo } from "./foo.css";
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"import { foo } from "./foo.css";"`
      );
    });

    test("ignores namespace import of CSS", () => {
      let code = dedent`
        import * as foo from "./foo.css";
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"import * as foo from "./foo.css";"`
      );
    });

    test("ignores conditional non side-effect require of CSS", () => {
      let code = dedent`
        const href = process.env.NODE_ENV === "production" ?
          require("./foo.min.css") :
          require("./foo.css");
      `;

      expect(addSuffixToCssSideEffectImports("js", code))
        .toMatchInlineSnapshot(`
        "const href = process.env.NODE_ENV === "production" ?
        require("./foo.min.css") :
        require("./foo.css");"
      `);
    });

    test("ignores conditional non side-effect require of CSS via logical operators", () => {
      let code = dedent`
        const href = (process.env.NODE_ENV === "production" && require("./foo.min.css")) || require("./foo.css");
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"const href = process.env.NODE_ENV === "production" && require("./foo.min.css") || require("./foo.css");"`
      );
    });

    test("ignores side-effect require of non-CSS", () => {
      let code = dedent`
        require("./foo");
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"require("./foo");"`
      );
    });

    test("ignores side-effect import of non-CSS", () => {
      let code = dedent`
        import "./foo";
      `;

      expect(addSuffixToCssSideEffectImports("js", code)).toMatchInlineSnapshot(
        `"import "./foo";"`
      );
    });

    test("ignores dynamic import", () => {
      let code = dedent`
        export const foo = async () => {
          await import("./foo.css");
        }
      `;

      expect(addSuffixToCssSideEffectImports("js", code))
        .toMatchInlineSnapshot(`
        "export const foo = async () => {
          await import("./foo.css");
        };"
      `);
    });
  });

  describe("parser support for language features", () => {
    function languageFeaturesFixture(options: { ts: boolean; jsx: boolean }) {
      let tsLanguageFeatures = dedent`
        // TS
        const exampleSatisfies = 'satisfies' satisfies string;
        enum ExampleEnum {
          Foo,
          Bar,
          Baz,
        }
      `;

      let jsxLanguageFeatures = dedent`
        // JSX
        const ExampleComponent = () => <div>JSX element</div>;
      `;

      let jsLanguageFeatures = dedent`
        // JS
        const topLevelAwait = await Promise.resolve('top level await');        
        function classDecorator(target) {
          return target;
        }        
        function methodDecorator(target) {
          return target;
        }
        @classDecorator
        class ExampleClass {
          #privateField;
          #privateFieldWithInitializer = 'private field with initializer';
          #privateMethod() {
            return 'private method';
          }
          @methodDecorator
          decoratedMethod() {
            return 'decorated method';
          }
        }        
        const numericSeparator = 1_000_000;
        const nullishCoalescing = null ?? 'nullish coalescing';
        const optionalChaining = (['optional', 'chaining'])?.join?.(' ');
        let optionalCatchBinding;
        try {
          optionalCatchBinding = error();
        } catch {
          optionalCatchBinding = 'optional catch binding';
        }
        export async function* asyncGenerator() {
          yield await Promise.resolve('async generator');
        }
      `;

      return [
        'require("./foo.css")',
        ...(options.ts ? [tsLanguageFeatures] : []),
        ...(options.jsx ? [jsxLanguageFeatures] : []),
        jsLanguageFeatures,
      ].join("\n\n");
    }

    test("JS language features", () => {
      let code = languageFeaturesFixture({ ts: false, jsx: false });

      expect(addSuffixToCssSideEffectImports("js", code))
        .toMatchInlineSnapshot(`
        "require("./foo.css?__remix_sideEffect__");

        // JS
        const topLevelAwait = await Promise.resolve('top level await');
        function classDecorator(target) {
          return target;
        }
        function methodDecorator(target) {
          return target;
        }
        @classDecorator class
        ExampleClass {
          #privateField;
          #privateFieldWithInitializer = 'private field with initializer';
          #privateMethod() {
            return 'private method';
          }
          @methodDecorator
          decoratedMethod() {
            return 'decorated method';
          }
        }
        const numericSeparator = 1_000_000;
        const nullishCoalescing = null ?? 'nullish coalescing';
        const optionalChaining = ['optional', 'chaining']?.join?.(' ');
        let optionalCatchBinding;
        try {
          optionalCatchBinding = error();
        } catch {
          optionalCatchBinding = 'optional catch binding';
        }
        export async function* asyncGenerator() {
          yield await Promise.resolve('async generator');
        }"
      `);
    });

    test("JSX language features", () => {
      let code = languageFeaturesFixture({ ts: false, jsx: true });

      expect(addSuffixToCssSideEffectImports("jsx", code))
        .toMatchInlineSnapshot(`
        "require("./foo.css?__remix_sideEffect__");

        // JSX
        const ExampleComponent = () => <div>JSX element</div>;

        // JS
        const topLevelAwait = await Promise.resolve('top level await');
        function classDecorator(target) {
          return target;
        }
        function methodDecorator(target) {
          return target;
        }
        @classDecorator class
        ExampleClass {
          #privateField;
          #privateFieldWithInitializer = 'private field with initializer';
          #privateMethod() {
            return 'private method';
          }
          @methodDecorator
          decoratedMethod() {
            return 'decorated method';
          }
        }
        const numericSeparator = 1_000_000;
        const nullishCoalescing = null ?? 'nullish coalescing';
        const optionalChaining = ['optional', 'chaining']?.join?.(' ');
        let optionalCatchBinding;
        try {
          optionalCatchBinding = error();
        } catch {
          optionalCatchBinding = 'optional catch binding';
        }
        export async function* asyncGenerator() {
          yield await Promise.resolve('async generator');
        }"
      `);
    });

    test("TS language features", () => {
      let code = languageFeaturesFixture({ ts: true, jsx: false });

      expect(addSuffixToCssSideEffectImports("tsx", code))
        .toMatchInlineSnapshot(`
        "require("./foo.css?__remix_sideEffect__");

        // TS
        const exampleSatisfies = ('satisfies' satisfies string);
        enum ExampleEnum {
          Foo,
          Bar,
          Baz,
        }

        // JS
        const topLevelAwait = await Promise.resolve('top level await');
        function classDecorator(target) {
          return target;
        }
        function methodDecorator(target) {
          return target;
        }
        @classDecorator class
        ExampleClass {
          #privateField;
          #privateFieldWithInitializer = 'private field with initializer';
          #privateMethod() {
            return 'private method';
          }
          @methodDecorator
          decoratedMethod() {
            return 'decorated method';
          }
        }
        const numericSeparator = 1_000_000;
        const nullishCoalescing = null ?? 'nullish coalescing';
        const optionalChaining = ['optional', 'chaining']?.join?.(' ');
        let optionalCatchBinding;
        try {
          optionalCatchBinding = error();
        } catch {
          optionalCatchBinding = 'optional catch binding';
        }
        export async function* asyncGenerator() {
          yield await Promise.resolve('async generator');
        }"
      `);
    });

    test("TSX language features", () => {
      let code = languageFeaturesFixture({ ts: true, jsx: true });

      expect(addSuffixToCssSideEffectImports("tsx", code))
        .toMatchInlineSnapshot(`
        "require("./foo.css?__remix_sideEffect__");

        // TS
        const exampleSatisfies = ('satisfies' satisfies string);
        enum ExampleEnum {
          Foo,
          Bar,
          Baz,
        }

        // JSX
        const ExampleComponent = () => <div>JSX element</div>;

        // JS
        const topLevelAwait = await Promise.resolve('top level await');
        function classDecorator(target) {
          return target;
        }
        function methodDecorator(target) {
          return target;
        }
        @classDecorator class
        ExampleClass {
          #privateField;
          #privateFieldWithInitializer = 'private field with initializer';
          #privateMethod() {
            return 'private method';
          }
          @methodDecorator
          decoratedMethod() {
            return 'decorated method';
          }
        }
        const numericSeparator = 1_000_000;
        const nullishCoalescing = null ?? 'nullish coalescing';
        const optionalChaining = ['optional', 'chaining']?.join?.(' ');
        let optionalCatchBinding;
        try {
          optionalCatchBinding = error();
        } catch {
          optionalCatchBinding = 'optional catch binding';
        }
        export async function* asyncGenerator() {
          yield await Promise.resolve('async generator');
        }"
      `);
    });
  });
});
