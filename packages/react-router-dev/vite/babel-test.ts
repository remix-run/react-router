import { getSourceExportNames, parseRouteSource, unwrapDefault } from "./babel";

describe("parseRouteSource", () => {
  test.each([
    ["route.ts", 'export const clientLoader = () => <string>"value";'],
    ["route.tsx", "export default () => <h1 />;"],
    ["route.tsx", "@decorator export default class Route {}"],
    ["route.tsx", "export default @decorator class Route {}"],
  ])("parses route syntax in %s", (id, code) => {
    expect(() => parseRouteSource(code, id)).not.toThrow();
  });
});

describe("getSourceExportNames", () => {
  test("finds runtime exports without including types or function parameters", () => {
    expect(
      getSourceExportNames(
        `export default function Route({loaderData}) {return <h1 />;}
         export function loader({request}) {}
         export const handle = {}, meta = () => [];
         export {value as links, type Loader as action} from './exports';
         export type Loader = () => void;
         export declare const headers: unknown;`,
        "route.tsx",
      ),
    ).toEqual(["default", "loader", "handle", "meta", "links"]);
  });
});

describe("unwrapDefault", () => {
  test("returns the default export from wrapped CommonJS imports", () => {
    function wrappedExport() {}

    expect(unwrapDefault({ default: wrappedExport })).toBe(wrappedExport);
  });

  test("returns the import value when the runtime has already unwrapped it", () => {
    function unwrappedExport() {}

    expect(unwrapDefault(unwrappedExport)).toBe(unwrappedExport);
  });
});
