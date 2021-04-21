import path from "path";
import type { RollupBuild } from "rollup";
import { rollup } from "rollup";
import babel from "@rollup/plugin-babel";
import nodeResolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import React from "react";
import ReactDOMServer from "react-dom/server";

import type { MdxConfig, MdxFunctionOption } from "../compiler/rollup/mdx";
import mdxPlugin from "../compiler/rollup/mdx";

import { getRemixConfig } from "../compiler/rollup/remixConfig";
let mockedGetRemixConfig = (getRemixConfig as unknown) as jest.MockedFunction<
  () => any
>;

jest.mock("../compiler/rollup/remixConfig");

describe("mdx rollup plugin", () => {
  beforeEach(() => {
    mockedGetRemixConfig.mockImplementation(async () => {
      return {};
    });
  });

  afterEach(() => {
    mockedGetRemixConfig.mockReset();
  });

  it("renders", async () => {
    let mod = await bundleMdxFile("basic.mdx");
    expect(renderMdxModule(mod)).toMatchInlineSnapshot(`"<p>I am mdx</p>"`);
  });

  it("exports meta and headers", async () => {
    let mod = await bundleMdxFile("basic.mdx");
    expect(mod.headers()).toMatchInlineSnapshot(`
      Object {
        "cache-control": "max-age=60",
      }
    `);
    expect(mod.meta()).toMatchInlineSnapshot(`
      Object {
        "title": "Some title",
      }
    `);
  });

  it("supports a function as config", async () => {
    expect.assertions(3);
    let options: MdxFunctionOption = (attributes, filename) => {
      expect(attributes).toMatchInlineSnapshot(`
        Object {
          "headers": Object {
            "cache-control": "max-age=60",
          },
          "meta": Object {
            "title": "Some title",
          },
        }
      `);
      expect(filename.endsWith("basic.mdx")).toBeTruthy();
      return {
        rehypePlugins: [fakeRehypePlugin]
      };
    };
    let mod = await bundleMdxFile("basic.mdx", options);
    expect(renderMdxModule(mod)).toMatchInlineSnapshot(
      `"<p>I am mdx</p><footer>injected!</footer>"`
    );
  });
});

////////////////////////////////////////////////////////////////////////////////
function fakeRehypePlugin(): any {
  return (root: any) => {
    root.children.push({
      type: "element",
      tagName: "footer",
      children: [
        {
          type: "text",
          value: "injected!"
        }
      ]
    });
    return root;
  };
}
interface MdxTestModule {
  default: () => React.ReactElement;
  meta: () => { [key: string]: string };
  headers: () => { [key: string]: string };
}

function renderMdxModule(mod: MdxTestModule) {
  return ReactDOMServer.renderToString(React.createElement(mod.default));
}

async function bundleMdxFile(
  filename: string,
  mdxConfig: MdxConfig = {}
): Promise<MdxTestModule> {
  let filepath = path.resolve(__dirname, "fixtures", filename);
  let bundle = await rollup({
    input: filepath,
    plugins: [mdxPlugin({ mdxConfig }), ...getPlugins()],
    external: ["@mdx-js/react"]
  });
  let code = await getBundleOutput(bundle);
  let module = { exports: {} };
  let params = [
    "module",
    "exports",
    "require",
    `${code}; return module.exports;`
  ];
  let evalFunc = new Function(...params); // eslint-disable-line
  return evalFunc(module, module.exports, require);
}

async function getBundleOutput(bundle: RollupBuild) {
  let { output } = await bundle.generate({ format: "cjs", exports: "named" });
  return output[0].code;
}

function getPlugins() {
  return [
    babel({
      babelHelpers: "bundled",
      configFile: false,
      exclude: /node_modules/,
      extensions: [".js", ".jsx", ".ts", ".tsx", ".md", ".mdx"],
      presets: [
        ["@babel/preset-react", { runtime: "automatic" }],
        ["@babel/preset-env", { targets: { node: true } }],
        [
          "@babel/preset-typescript",
          {
            allExtensions: true,
            isTSX: true
          }
        ]
      ]
    }),
    nodeResolve({
      extensions: [".js", ".json", ".ts", ".tsx"]
    }),
    commonjs()
  ];
}
