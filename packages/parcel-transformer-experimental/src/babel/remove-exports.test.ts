import { generate, parse } from "./babel";
import { removeExports } from "./remove-exports";

function transform(code: string, exportsToRemove: string[]) {
  let ast = parse(code, { sourceType: "module" });
  removeExports(ast, exportsToRemove);
  return generate(ast);
}

describe("transform", () => {
  test("arrow function", () => {
    let result = transform(
      `
      export const removedExport_1 = () => {}
      export const removedExport_2 = () => {}

      export const keptExport_1 = () => {}
      export const keptExport_2 = () => {}
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = () => {};
      export const keptExport_2 = () => {};"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("arrow function with dependencies", () => {
    let result = transform(
      `
      import { removedLib } from 'removed-lib'
      import { keptLib } from 'kept-lib'
      import { sharedLib } from 'shared-lib'

      const REMOVED_STRING = 'REMOVED_STRING'

      const sharedUtil = () => sharedLib()
      const removedUtil = () => sharedUtil(removedLib(REMOVED_STRING))
      const keptUtil = () => sharedUtil(keptLib())

      export const removedExport_1 = () => removedUtil()
      export const removedExport_2 = () => removedUtil()

      export const keptExport_1 = () => keptUtil()
      export const keptExport_2 = () => keptUtil()
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptLib } from 'kept-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const keptUtil = () => sharedUtil(keptLib());
      export const keptExport_1 = () => keptUtil();
      export const keptExport_2 = () => keptUtil();"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("arrow function with property assignment", () => {
    let result = transform(
      `
      export const removedExport_1 = () => {}
      removedExport_1.removedProperty = true
      export const removedExport_2 = () => {}
      removedExport_2.removedProperty = true
      
      export const keptExport_1 = () => {}
      keptExport_1.keptProperty = true
      export const keptExport_2 = () => {}
      keptExport_2.keptProperty = true
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = () => {};
      keptExport_1.keptProperty = true;
      export const keptExport_2 = () => {};
      keptExport_2.keptProperty = true;"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("function statement", () => {
    let result = transform(
      `
      export function removedExport_1(){}
      export function removedExport_2(){}

      export function keptExport_1(){}
      export function keptExport_2(){}
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export function keptExport_1() {}
      export function keptExport_2() {}"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("function statement with dependencies", () => {
    let result = transform(
      `
      import { removedLib } from 'removed-lib'
      import { keptLib } from 'kept-lib'
      import { sharedLib } from 'shared-lib'

      const REMOVED_STRING = 'REMOVED_STRING'

      function sharedUtil() { return sharedLib() }
      function removedUtil() { return sharedUtil(removedLib(REMOVED_STRING)) }
      function keptUtil() { return sharedUtil(keptLib()) }

      export function removedExport_1() { return removedUtil() }
      export function removedExport_2() { return removedUtil() }

      export function keptExport_1() { return keptUtil() }
      export function keptExport_2() { return keptUtil() }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptLib } from 'kept-lib';
      import { sharedLib } from 'shared-lib';
      function sharedUtil() {
        return sharedLib();
      }
      function keptUtil() {
        return sharedUtil(keptLib());
      }
      export function keptExport_1() {
        return keptUtil();
      }
      export function keptExport_2() {
        return keptUtil();
      }"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("function statement with property assignment", () => {
    let result = transform(
      `
      export function removedExport_1(){}
      removedExport_1.removedProperty = true
      export function removedExport_2(){}
      removedExport_2.removedProperty = true

      export function keptExport_1(){}
      keptExport_1.keptProperty = true
      export function keptExport_2(){}
      keptExport_2.keptProperty = true
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export function keptExport_1() {}
      keptExport_1.keptProperty = true;
      export function keptExport_2() {}
      keptExport_2.keptProperty = true;"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("object", () => {
    let result = transform(
      `
      export const removedExport_1 = {}
      export const removedExport_2 = {}

      export const keptExport_1 = {}
      export const keptExport_2 = {}
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = {};
      export const keptExport_2 = {};"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("object with dependencies", () => {
    let result = transform(
      `
      import { removedLib } from 'removed-lib'
      import { keptLib } from 'kept-lib'
      import { sharedLib } from 'shared-lib'

      const REMOVED_STRING = 'REMOVED_STRING'

      const sharedUtil = () => sharedLib()
      const removedUtil = () => sharedUtil(removedLib(REMOVED_STRING))
      const keptUtil = () => sharedUtil(keptLib())

      export const removedExport_1 = { value: removedUtil() }
      export const removedExport_2 = { value: removedUtil() }

      export const keptExport_1 = { value: keptUtil() }
      export const keptExport_2 = { value: keptUtil() }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptLib } from 'kept-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const keptUtil = () => sharedUtil(keptLib());
      export const keptExport_1 = {
        value: keptUtil()
      };
      export const keptExport_2 = {
        value: keptUtil()
      };"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("class", () => {
    let result = transform(
      `
      export class removedExport_1 {}
      export class removedExport_2 {}

      export class keptExport_1 {}
      export class keptExport_2 {}
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export class keptExport_1 {}
      export class keptExport_2 {}"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("class with dependencies", () => {
    let result = transform(
      `
      import { removedLib } from 'removed-lib'
      import { keptLib } from 'kept-lib'
      import { sharedLib } from 'shared-lib'

      const REMOVED_STRING = 'REMOVED_STRING'

      const sharedUtil = () => sharedLib()
      const removedUtil = () => sharedUtil(removedLib(REMOVED_STRING))
      const keptUtil = () => sharedUtil(keptLib())

      export class removedExport_1{
        static util = removedUtil()
      }
      export class removedExport_2{
        static util = removedUtil()
      }

      export class keptExport_1{
        static util = keptUtil()
      }
      export class keptExport_2{
        static util = keptUtil()
      }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptLib } from 'kept-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const keptUtil = () => sharedUtil(keptLib());
      export class keptExport_1 {
        static util = keptUtil();
      }
      export class keptExport_2 {
        static util = keptUtil();
      }"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("function call", () => {
    let result = transform(
      `
      export const removedExport_1 = globalFunction()
      export const removedExport_2 = globalFunction()

      export const keptExport_1 = globalFunction()
      export const keptExport_2 = globalFunction()
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = globalFunction();
      export const keptExport_2 = globalFunction();"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("function call with dependencies", () => {
    let result = transform(
      `
      import { removedLib } from 'removed-lib'
      import { keptLib } from 'kept-lib'
      import { sharedLib } from 'shared-lib'

      const REMOVED_STRING = 'REMOVED_STRING'

      const sharedUtil = () => sharedLib()
      const removedUtil = () => sharedUtil(removedLib(REMOVED_STRING))
      const keptUtil = () => sharedUtil(keptLib())

      export const removedExport_1 = removedUtil()
      export const removedExport_2 = removedUtil()

      export const keptExport_1 = keptUtil()
      export const keptExport_2 = keptUtil()
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptLib } from 'kept-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const keptUtil = () => sharedUtil(keptLib());
      export const keptExport_1 = keptUtil();
      export const keptExport_2 = keptUtil();"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("iife", () => {
    let result = transform(
      `
      export const removedExport_1 = (() => {})()
      export const removedExport_2 = (() => {})()

      export const keptExport_1 = (() => {})()
      export const keptExport_2 = (() => {})()
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = (() => {})();
      export const keptExport_2 = (() => {})();"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("iife with dependencies", () => {
    let result = transform(
      `
      import { removedLib } from 'removed-lib'
      import { keptLib } from 'kept-lib'
      import { sharedLib } from 'shared-lib'

      const REMOVED_STRING = 'REMOVED_STRING'

      const sharedUtil = () => sharedLib()
      const removedUtil = () => sharedUtil(removedLib(REMOVED_STRING))
      const keptUtil = () => sharedUtil(keptLib())

      export const removedExport_1 = (() => removedUtil())()
      export const removedExport_2 = (() => removedUtil())()

      export const keptExport_1 = (() => keptUtil())()
      export const keptExport_2 = (() => keptUtil())()
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptLib } from 'kept-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const keptUtil = () => sharedUtil(keptLib());
      export const keptExport_1 = (() => keptUtil())();
      export const keptExport_2 = (() => keptUtil())();"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("aggregated export", () => {
    let result = transform(
      `
      const removedExport_1 = () => {}
      removedExport_1.removedProperty = true
      const removedExport_2 = () => {}
      removedExport_2.removedProperty = true

      const keptExport_1 = () => {}
      keptExport_1.keptProperty = true
      const keptExport_2 = () => {}
      keptExport_2.keptProperty = true

      export { removedExport_1 }
      export { removedExport_2 }

      export { keptExport_1 }
      export { keptExport_2 }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const keptExport_1 = () => {};
      keptExport_1.keptProperty = true;
      const keptExport_2 = () => {};
      keptExport_2.keptProperty = true;
      export { keptExport_1 };
      export { keptExport_2 };"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("aggregated export multiple", () => {
    let result = transform(
      `
      const removedExport_1 = () => {}
      removedExport_1.removedProperty = true
      const removedExport_2 = () => {}
      removedExport_2.removedProperty = true

      const keptExport_1 = () => {}
      keptExport_1.keptProperty = true
      const keptExport_2 = () => {}
      keptExport_2.keptProperty = true

      export { removedExport_1, removedExport_2 }
      export { keptExport_1, keptExport_2 }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const keptExport_1 = () => {};
      keptExport_1.keptProperty = true;
      const keptExport_2 = () => {};
      keptExport_2.keptProperty = true;
      export { keptExport_1, keptExport_2 };"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("aggregated export multiple mixed", () => {
    let result = transform(
      `
      const removedExport_1 = () => {}
      removedExport_1.removedProperty = true
      const removedExport_2 = () => {}
      removedExport_2.removedProperty = true

      const keptExport_1 = () => {}
      keptExport_1.keptProperty = true
      const keptExport_2 = () => {}
      keptExport_2.keptProperty = true

      export { removedExport_1, keptExport_1 }
      export { removedExport_2, keptExport_2 }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const keptExport_1 = () => {};
      keptExport_1.keptProperty = true;
      const keptExport_2 = () => {};
      keptExport_2.keptProperty = true;
      export { keptExport_1 };
      export { keptExport_2 };"
    `);
    expect(result.code).not.toMatch(/removeMe/i);
  });

  test("aggregated export multiple mixed and renamed", () => {
    let result = transform(
      `
      const removedExport_1 = () => {}
      removedExport_1.removedProperty = true
      const removedExport_2 = () => {}
      removedExport_2.removedProperty = true

      const keptExport_1 = () => {}
      keptExport_1.keptProperty = true
      const keptExport_2 = () => {}
      keptExport_2.keptProperty = true

      export {
        removedExport_1 as removedExport_1_renamed,
        keptExport_1 as keptExport_1_renamed
      }
      export {
        removedExport_2 as removedExport_2_renamed,
        keptExport_2 as keptExport_2_renamed
      }
    `,
      ["removedExport_1_renamed", "removedExport_2_renamed"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const keptExport_1 = () => {};
      keptExport_1.keptProperty = true;
      const keptExport_2 = () => {};
      keptExport_2.keptProperty = true;
      export { keptExport_1 as keptExport_1_renamed };
      export { keptExport_2 as keptExport_2_renamed };"
    `);
    expect(result.code).not.toMatch(/removeMe/i);
  });

  test("re-export", () => {
    let result = transform(
      `
      export { removedExport_1 } from './removed/1'
      export { removedExport_2 } from './removed/2'

      export { keptExport_1 } from './kept/1'
      export { keptExport_2 } from './kept/2'
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export { keptExport_1 } from './kept/1';
      export { keptExport_2 } from './kept/2';"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("re-export multiple", () => {
    let result = transform(
      `
      export { removedExport_1, removedExport_2 } from './removed'
      export { keptExport_1, keptExport_2 } from './kept'
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(
      "\"export { keptExport_1, keptExport_2 } from './kept';\""
    );
    expect(result.code).not.toMatch(/removed/i);
  });

  test("re-export multiple mixed", () => {
    let result = transform(
      `
      export { removeMe_1, keepMe_1 } from './1'
      export { removeMe_2, keepMe_2 } from './2'
    `,
      ["removeMe_1", "removeMe_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export { keepMe_1 } from './1';
      export { keepMe_2 } from './2';"
    `);
    expect(result.code).not.toMatch(/removeMe/i);
  });

  test("re-export manual", () => {
    let result = transform(
      `
      import { removedExport_1 } from './removed/1'
      import { removedExport_2 } from './removed/2'
      import { keptExport_1 } from './kept/1'
      import { keptExport_2 } from './kept/2'

      export { removedExport_1 }
      export { removedExport_2 }

      export { keptExport_1 }
      export { keptExport_2 }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptExport_1 } from './kept/1';
      import { keptExport_2 } from './kept/2';
      export { keptExport_1 };
      export { keptExport_2 };"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("re-export manual multiple", () => {
    let result = transform(
      `
      import { removedExport_1, removedExport_2 } from './removed'
      import { keptExport_1, keptExport_2 } from './kept'

      export { removedExport_1, removedExport_2 }
      export { keptExport_1, keptExport_2 }
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keptExport_1, keptExport_2 } from './kept';
      export { keptExport_1, keptExport_2 };"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("re-export manual multiple mixed", () => {
    let result = transform(
      `
      import { removeMe_1, keepMe_1 } from './1'
      import { removeMe_2, keepMe_2 } from './2'

      export { removeMe_1, keepMe_1 }
      export { removeMe_2, keepMe_2 }
    `,
      ["removeMe_1", "removeMe_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { keepMe_1 } from './1';
      import { keepMe_2 } from './2';
      export { keepMe_1 };
      export { keepMe_2 };"
    `);
    expect(result.code).not.toMatch(/removeMe/i);
  });

  test("number", () => {
    let result = transform(
      `
      export const removedExport_1 = 123
      export const removedExport_2 = 123

      export const keptExport_1 = 123
      export const keptExport_2 = 123
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = 123;
      export const keptExport_2 = 123;"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("string", () => {
    let result = transform(
      `
      export const removedExport_1 = 'string'
      export const removedExport_2 = 'string'

      export const keptExport_1 = 'string'
      export const keptExport_2 = 'string'
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = 'string';
      export const keptExport_2 = 'string';"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("string reference", () => {
    let result = transform(
      `
      const REMOVED_STRING = 'REMOVED_STRING';
      const KEPT_STRING = 'KEPT_STRING';

      export const removedExport_1 = REMOVED_STRING
      export const removedExport_2 = REMOVED_STRING

      export const keptExport_1 = KEPT_STRING
      export const keptExport_2 = KEPT_STRING
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const KEPT_STRING = 'KEPT_STRING';
      export const keptExport_1 = KEPT_STRING;
      export const keptExport_2 = KEPT_STRING;"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("null", () => {
    let result = transform(
      `
      export const removedExport_1 = null
      export const removedExport_2 = null

      export const keptExport_1 = null
      export const keptExport_2 = null
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = null;
      export const keptExport_2 = null;"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("multiple variable declarators", () => {
    let result = transform(
      `
      export const removedExport_1 = null,
        removedExport_2 = null

      export const keptExport_1 = null,
        keptExport_2 = null
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = null,
        keptExport_2 = null;"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("multiple variable declarators mixed", () => {
    let result = transform(
      `
      export const removedExport_1 = null,
        keptExport_1 = null

      export const keptExport_2 = null,
        removedExport_2 = null
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = null;
      export const keptExport_2 = null;"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("array destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [removedExport_1, removedExport_2] = [null, null]

        export const [keptExport_1, keptExport_2] = [null, null]
      `,
        ["removedExport_1", "removedExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot remove destructured export "removedExport_1"]`
    );
  });

  test("array rest destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [...removedExport_1] = [null, null]

        export const [keptExport_1, keptExport_2] = [null, null]
      `,
        ["removedExport_1", "removedExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot remove destructured export "removedExport_1"]`
    );
  });

  test("nested array destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [keepMe_1, [{ nested: [ { nested: [removedExport_2] } ] }] ] = nested;
      `,
        ["removedExport_1", "removedExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot remove destructured export "removedExport_2"]`
    );
  });

  test("array destructuring works when nothing is removed", () => {
    let result = transform(
      `
      export const [keptExport_1, keptExport_2] = [null, null]
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(
      `"export const [keptExport_1, keptExport_2] = [null, null];"`
    );
    expect(result.code).not.toMatch(/removed/i);
  });

  test("object destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const { removedExport_1, removedExport_2 } = {}

        export const { keptExport_1, keptExport_2 } = {}
      `,
        ["removedExport_1", "removedExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot remove destructured export "removedExport_1"]`
    );
  });

  test("object rest destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const { ...removedExport_1 } = {}

        export const { ...keptExport_1 } = {}
      `,
        ["removedExport_1", "removedExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot remove destructured export "removedExport_1"]`
    );
  });

  test("nested object destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [keepMe_1, [{ nested: [ { nested: { removedExport_2 } } ] }]] = nested;
      `,
        ["removedExport_1", "removedExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `[Error: Cannot remove destructured export "removedExport_2"]`
    );
  });

  test("object destructuring works when nothing is removed", () => {
    let result = transform(
      `
      export const { keptExport_1, keptExport_2 } = {}
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const {
        keptExport_1,
        keptExport_2
      } = {};"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });

  test("default export", () => {
    let result = transform(
      `
      export const keepMe = () => {};
      keepMe.keptProperty = true;

      const removeMe = () => {};
      removeMe.removedProperty = true;

      export default removeMe;
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keepMe = () => {};
      keepMe.keptProperty = true;"
    `);
    expect(result.code).not.toMatch(/default/i);
  });

  test("default export aggregated", () => {
    let result = transform(
      `
      export const keepMe = () => {};
      keepMe.keptProperty = true;

      const removeMe = () => {};
      removeMe.removedProperty = true;

      export { removeMe as default };
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keepMe = () => {};
      keepMe.keptProperty = true;"
    `);
    expect(result.code).not.toMatch(/default/i);
  });

  test("default export aggregated mixed", () => {
    let result = transform(
      `
      const keepMe = () => {};
      keepMe.keptProperty = true;

      const removeMe = () => {};
      removeMe.removedProperty = true;

      export { removeMe as default, keepMe };
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const keepMe = () => {};
      keepMe.keptProperty = true;
      export { keepMe };"
    `);
    expect(result.code).not.toMatch(/default/i);
  });

  test("default re-export", () => {
    let result = transform(
      `
      export const keepMe = null;

      export { default } from "./module";
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(`"export const keepMe = null;"`);
    expect(result.code).not.toMatch(/default/i);
  });

  test("default re-export mixed", () => {
    let result = transform(
      `
      export { default, keepMe } from "./module";
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(
      `"export { keepMe } from "./module";"`
    );
    expect(result.code).not.toMatch(/default/i);
  });

  test("nothing removed", () => {
    let result = transform(
      `
      export const keptExport_1 = () => {}
      export const keptExport_2 = () => {}
    `,
      ["removedExport_1", "removedExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const keptExport_1 = () => {};
      export const keptExport_2 = () => {};"
    `);
    expect(result.code).not.toMatch(/removed/i);
  });
});
