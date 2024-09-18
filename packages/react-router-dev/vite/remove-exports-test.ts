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
      export const serverExport_1 = () => {}
      export const serverExport_2 = () => {}

      export const clientExport_1 = () => {}
      export const clientExport_2 = () => {}
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = () => {};
      export const clientExport_2 = () => {};"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("arrow function with dependencies", () => {
    let result = transform(
      `
      import { serverLib } from 'server-lib'
      import { clientLib } from 'client-lib'
      import { sharedLib } from 'shared-lib'

      const SERVER_STRING = 'SERVER_STRING'

      const sharedUtil = () => sharedLib()
      const serverUtil = () => sharedUtil(serverLib(SERVER_STRING))
      const clientUtil = () => sharedUtil(clientLib())

      export const serverExport_1 = () => serverUtil()
      export const serverExport_2 = () => serverUtil()

      export const clientExport_1 = () => clientUtil()
      export const clientExport_2 = () => clientUtil()
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientLib } from 'client-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const clientUtil = () => sharedUtil(clientLib());
      export const clientExport_1 = () => clientUtil();
      export const clientExport_2 = () => clientUtil();"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("function statement", () => {
    let result = transform(
      `
      export function serverExport_1(){}
      export function serverExport_2(){}

      export function clientExport_1(){}
      export function clientExport_2(){}
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export function clientExport_1() {}
      export function clientExport_2() {}"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("function statement with dependencies", () => {
    let result = transform(
      `
      import { serverLib } from 'server-lib'
      import { clientLib } from 'client-lib'
      import { sharedLib } from 'shared-lib'

      const SERVER_STRING = 'SERVER_STRING'

      function sharedUtil() { return sharedLib() }
      function serverUtil() { return sharedUtil(serverLib(SERVER_STRING)) }
      function clientUtil() { return sharedUtil(clientLib()) }

      export function serverExport_1() { return serverUtil() }
      export function serverExport_2() { return serverUtil() }

      export function clientExport_1() { return clientUtil() }
      export function clientExport_2() { return clientUtil() }
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientLib } from 'client-lib';
      import { sharedLib } from 'shared-lib';
      function sharedUtil() {
        return sharedLib();
      }
      function clientUtil() {
        return sharedUtil(clientLib());
      }
      export function clientExport_1() {
        return clientUtil();
      }
      export function clientExport_2() {
        return clientUtil();
      }"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("object", () => {
    let result = transform(
      `
      export const serverExport_1 = {}
      export const serverExport_2 = {}

      export const clientExport_1 = {}
      export const clientExport_2 = {}
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = {};
      export const clientExport_2 = {};"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("object with dependencies", () => {
    let result = transform(
      `
      import { serverLib } from 'server-lib'
      import { clientLib } from 'client-lib'
      import { sharedLib } from 'shared-lib'

      const SERVER_STRING = 'SERVER_STRING'

      const sharedUtil = () => sharedLib()
      const serverUtil = () => sharedUtil(serverLib(SERVER_STRING))
      const clientUtil = () => sharedUtil(clientLib())

      export const serverExport_1 = { value: serverUtil() }
      export const serverExport_2 = { value: serverUtil() }

      export const clientExport_1 = { value: clientUtil() }
      export const clientExport_2 = { value: clientUtil() }
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientLib } from 'client-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const clientUtil = () => sharedUtil(clientLib());
      export const clientExport_1 = {
        value: clientUtil()
      };
      export const clientExport_2 = {
        value: clientUtil()
      };"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("class", () => {
    let result = transform(
      `
      export class serverExport_1 {}
      export class serverExport_2 {}

      export class clientExport_1 {}
      export class clientExport_2 {}
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export class clientExport_1 {}
      export class clientExport_2 {}"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("class with dependencies", () => {
    let result = transform(
      `
      import { serverLib } from 'server-lib'
      import { clientLib } from 'client-lib'
      import { sharedLib } from 'shared-lib'

      const SERVER_STRING = 'SERVER_STRING'

      const sharedUtil = () => sharedLib()
      const serverUtil = () => sharedUtil(serverLib(SERVER_STRING))
      const clientUtil = () => sharedUtil(clientLib())

      export class serverExport_1{
        static util = serverUtil()
      }
      export class serverExport_2{
        static util = serverUtil()
      }

      export class clientExport_1{
        static util = clientUtil()
      }
      export class clientExport_2{
        static util = clientUtil()
      }
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientLib } from 'client-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const clientUtil = () => sharedUtil(clientLib());
      export class clientExport_1 {
        static util = clientUtil();
      }
      export class clientExport_2 {
        static util = clientUtil();
      }"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("function call", () => {
    let result = transform(
      `
      export const serverExport_1 = globalFunction()
      export const serverExport_2 = globalFunction()

      export const clientExport_1 = globalFunction()
      export const clientExport_2 = globalFunction()
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = globalFunction();
      export const clientExport_2 = globalFunction();"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("function call with dependencies", () => {
    let result = transform(
      `
      import { serverLib } from 'server-lib'
      import { clientLib } from 'client-lib'
      import { sharedLib } from 'shared-lib'

      const SERVER_STRING = 'SERVER_STRING'

      const sharedUtil = () => sharedLib()
      const serverUtil = () => sharedUtil(serverLib(SERVER_STRING))
      const clientUtil = () => sharedUtil(clientLib())

      export const serverExport_1 = serverUtil()
      export const serverExport_2 = serverUtil()

      export const clientExport_1 = clientUtil()
      export const clientExport_2 = clientUtil()
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientLib } from 'client-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const clientUtil = () => sharedUtil(clientLib());
      export const clientExport_1 = clientUtil();
      export const clientExport_2 = clientUtil();"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("iife", () => {
    let result = transform(
      `
      export const serverExport_1 = (() => {})()
      export const serverExport_2 = (() => {})()

      export const clientExport_1 = (() => {})()
      export const clientExport_2 = (() => {})()
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = (() => {})();
      export const clientExport_2 = (() => {})();"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("iife with dependencies", () => {
    let result = transform(
      `
      import { serverLib } from 'server-lib'
      import { clientLib } from 'client-lib'
      import { sharedLib } from 'shared-lib'

      const SERVER_STRING = 'SERVER_STRING'

      const sharedUtil = () => sharedLib()
      const serverUtil = () => sharedUtil(serverLib(SERVER_STRING))
      const clientUtil = () => sharedUtil(clientLib())

      export const serverExport_1 = (() => serverUtil())()
      export const serverExport_2 = (() => serverUtil())()

      export const clientExport_1 = (() => clientUtil())()
      export const clientExport_2 = (() => clientUtil())()
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientLib } from 'client-lib';
      import { sharedLib } from 'shared-lib';
      const sharedUtil = () => sharedLib();
      const clientUtil = () => sharedUtil(clientLib());
      export const clientExport_1 = (() => clientUtil())();
      export const clientExport_2 = (() => clientUtil())();"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("aggregated export", () => {
    let result = transform(
      `
      const serverExport_1 = 123
      const serverExport_2 = 123

      const clientExport_1 = 123
      const clientExport_2 = 123

      export { serverExport_1 }
      export { serverExport_2 }

      export { clientExport_1 }
      export { clientExport_2 }
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const clientExport_1 = 123;
      const clientExport_2 = 123;
      export { clientExport_1 };
      export { clientExport_2 };"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("aggregated export multiple", () => {
    let result = transform(
      `
      const serverExport_1 = 123
      const serverExport_2 = 123

      const clientExport_1 = 123
      const clientExport_2 = 123

      export { serverExport_1, serverExport_2 }
      export { clientExport_1, clientExport_2 }
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const clientExport_1 = 123;
      const clientExport_2 = 123;
      export { clientExport_1, clientExport_2 };"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("aggregated export multiple mixed", () => {
    let result = transform(
      `
      const removeMe_1 = 123
      const removeMe_2 = 123

      const keepMe_1 = 123
      const keepMe_2 = 123

      export { removeMe_1, keepMe_1 }
      export { removeMe_2, keepMe_2 }
    `,
      ["removeMe_1", "removeMe_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const keepMe_1 = 123;
      const keepMe_2 = 123;
      export { keepMe_1 };
      export { keepMe_2 };"
    `);
    expect(result.code).not.toMatch(/removeMe/i);
  });

  test("re-export", () => {
    let result = transform(
      `
      export { serverExport_1 } from './server/1'
      export { serverExport_2 } from './server/2'

      export { clientExport_1 } from './client/1'
      export { clientExport_2 } from './client/2'
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export { clientExport_1 } from './client/1';
      export { clientExport_2 } from './client/2';"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("re-export multiple", () => {
    let result = transform(
      `
      export { serverExport_1, serverExport_2 } from './server'
      export { clientExport_1, clientExport_2 } from './client'
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(
      "\"export { clientExport_1, clientExport_2 } from './client';\""
    );
    expect(result.code).not.toMatch(/server/i);
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
      import { serverExport_1 } from './server/1'
      import { serverExport_2 } from './server/2'
      import { clientExport_1 } from './client/1'
      import { clientExport_2 } from './client/2'

      export { serverExport_1 }
      export { serverExport_2 }

      export { clientExport_1 }
      export { clientExport_2 }
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientExport_1 } from './client/1';
      import { clientExport_2 } from './client/2';
      export { clientExport_1 };
      export { clientExport_2 };"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("re-export manual multiple", () => {
    let result = transform(
      `
      import { serverExport_1, serverExport_2 } from './server'
      import { clientExport_1, clientExport_2 } from './client'

      export { serverExport_1, serverExport_2 }
      export { clientExport_1, clientExport_2 }
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "import { clientExport_1, clientExport_2 } from './client';
      export { clientExport_1, clientExport_2 };"
    `);
    expect(result.code).not.toMatch(/server/i);
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
      export const serverExport_1 = 123
      export const serverExport_2 = 123

      export const clientExport_1 = 123
      export const clientExport_2 = 123
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = 123;
      export const clientExport_2 = 123;"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("string", () => {
    let result = transform(
      `
      export const serverExport_1 = 'string'
      export const serverExport_2 = 'string'

      export const clientExport_1 = 'string'
      export const clientExport_2 = 'string'
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = 'string';
      export const clientExport_2 = 'string';"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("string reference", () => {
    let result = transform(
      `
      const SERVER_STRING = 'SERVER_STRING';
      const CLIENT_STRING = 'CLIENT_STRING';

      export const serverExport_1 = SERVER_STRING
      export const serverExport_2 = SERVER_STRING

      export const clientExport_1 = CLIENT_STRING
      export const clientExport_2 = CLIENT_STRING
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const CLIENT_STRING = 'CLIENT_STRING';
      export const clientExport_1 = CLIENT_STRING;
      export const clientExport_2 = CLIENT_STRING;"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("null", () => {
    let result = transform(
      `
      export const serverExport_1 = null
      export const serverExport_2 = null

      export const clientExport_1 = null
      export const clientExport_2 = null
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = null;
      export const clientExport_2 = null;"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("multiple variable declarators", () => {
    let result = transform(
      `
      export const serverExport_1 = null,
        serverExport_2 = null

      export const clientExport_1 = null,
        clientExport_2 = null
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = null,
        clientExport_2 = null;"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("multiple variable declarators mixed", () => {
    let result = transform(
      `
      export const serverExport_1 = null,
        clientExport_1 = null

      export const clientExport_2 = null,
        serverExport_2 = null
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = null;
      export const clientExport_2 = null;"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("array destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [serverExport_1, serverExport_2] = [null, null]

        export const [clientExport_1, clientExport_2] = [null, null]
      `,
        ["serverExport_1", "serverExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot remove destructured export "serverExport_1""`
    );
  });

  test("array rest destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [...serverExport_1] = [null, null]

        export const [clientExport_1, clientExport_2] = [null, null]
      `,
        ["serverExport_1", "serverExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot remove destructured export "serverExport_1""`
    );
  });

  test("nested array destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [keepMe_1, [{ nested: [ { nested: [serverExport_2] } ] }] ] = nested;
      `,
        ["serverExport_1", "serverExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot remove destructured export "serverExport_2""`
    );
  });

  test("array destructuring works when nothing is removed", () => {
    let result = transform(
      `
      export const [clientExport_1, clientExport_2] = [null, null]
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(
      `"export const [clientExport_1, clientExport_2] = [null, null];"`
    );
    expect(result.code).not.toMatch(/server/i);
  });

  test("object destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const { serverExport_1, serverExport_2 } = {}

        export const { clientExport_1, clientExport_2 } = {}
      `,
        ["serverExport_1", "serverExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot remove destructured export "serverExport_1""`
    );
  });

  test("object rest destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const { ...serverExport_1 } = {}

        export const { ...clientExport_1 } = {}
      `,
        ["serverExport_1", "serverExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot remove destructured export "serverExport_1""`
    );
  });

  test("nested object destructuring throws on removed export", () => {
    expect(() =>
      transform(
        `
        export const [keepMe_1, [{ nested: [ { nested: { serverExport_2 } } ] }]] = nested;
      `,
        ["serverExport_1", "serverExport_2"]
      )
    ).toThrowErrorMatchingInlineSnapshot(
      `"Cannot remove destructured export "serverExport_2""`
    );
  });

  test("object destructuring works when nothing is removed", () => {
    let result = transform(
      `
      export const { clientExport_1, clientExport_2 } = {}
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const {
        clientExport_1,
        clientExport_2
      } = {};"
    `);
    expect(result.code).not.toMatch(/server/i);
  });

  test("default export", () => {
    let result = transform(
      `
      export const keepMe = null;

      const removeMe = null;

      export default removeMe;
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(`"export const keepMe = null;"`);
    expect(result.code).not.toMatch(/default/i);
  });

  test("default export aggregated", () => {
    let result = transform(
      `
      export const keepMe = null;

      const removeMe = null;

      export { removeMe as default };
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(`"export const keepMe = null;"`);
    expect(result.code).not.toMatch(/default/i);
  });

  test("default export aggregated mixed", () => {
    let result = transform(
      `
      const keepMe = null;

      const removeMe = null;

      export { removeMe as default, keepMe };
    `,
      ["default"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "const keepMe = null;
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
      export const clientExport_1 = () => {}
      export const clientExport_2 = () => {}
    `,
      ["serverExport_1", "serverExport_2"]
    );
    expect(result.code).toMatchInlineSnapshot(`
      "export const clientExport_1 = () => {};
      export const clientExport_2 = () => {};"
    `);
    expect(result.code).not.toMatch(/server/i);
  });
});
