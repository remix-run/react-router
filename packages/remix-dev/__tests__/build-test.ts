import path from "path";
import type { RollupOutput } from "rollup";

import { BuildMode, BuildTarget } from "../build";
import type { BuildOptions } from "../compiler";
import { build, generate } from "../compiler";
import type { RemixConfig } from "../config";
import { readConfig } from "../config";

const remixRoot = path.resolve(__dirname, "../../../fixtures/gists-app");

async function generateBuild(config: RemixConfig, options: BuildOptions) {
  return await generate(await build(config, options));
}

function getFilenames(output: RollupOutput) {
  return output.output.map(item => item.fileName).sort();
}

describe.skip("building", () => {
  // describe("building", () => {
  let config: RemixConfig;
  beforeAll(async () => {
    config = await readConfig(remixRoot);
  });

  beforeEach(() => {
    jest.setTimeout(20000);
  });

  describe("the development server build", () => {
    it("generates the correct bundles", async () => {
      let output = await generateBuild(config, {
        mode: BuildMode.Development,
        target: BuildTarget.Server
      });

      expect(getFilenames(output)).toMatchInlineSnapshot(`
        Array [
          "_shared/Shared-072c977d.js",
          "_shared/_rollupPluginBabelHelpers-8a275fd9.js",
          "entry.server.js",
          "index.js",
          "pages/one.js",
          "pages/two.js",
          "root.js",
          "routes/404.js",
          "routes/gists.js",
          "routes/gists.mine.js",
          "routes/gists/$username.js",
          "routes/gists/index.js",
          "routes/index.js",
          "routes/links.js",
          "routes/loader-errors.js",
          "routes/loader-errors/nested.js",
          "routes/methods.js",
          "routes/page/four.js",
          "routes/page/three.js",
          "routes/prefs.js",
          "routes/render-errors.js",
          "routes/render-errors/nested.js",
        ]
      `);
    });
  });

  describe("the production server build", () => {
    it("generates the correct bundles", async () => {
      let output = await generateBuild(config, {
        mode: BuildMode.Production,
        target: BuildTarget.Server
      });

      expect(getFilenames(output)).toMatchInlineSnapshot(`
        Array [
          "_shared/Shared-072c977d.js",
          "_shared/_rollupPluginBabelHelpers-8a275fd9.js",
          "entry.server.js",
          "index.js",
          "pages/one.js",
          "pages/two.js",
          "root.js",
          "routes/404.js",
          "routes/gists.js",
          "routes/gists.mine.js",
          "routes/gists/$username.js",
          "routes/gists/index.js",
          "routes/index.js",
          "routes/links.js",
          "routes/loader-errors.js",
          "routes/loader-errors/nested.js",
          "routes/methods.js",
          "routes/page/four.js",
          "routes/page/three.js",
          "routes/prefs.js",
          "routes/render-errors.js",
          "routes/render-errors/nested.js",
        ]
      `);
    });
  });

  describe("the development browser build", () => {
    it("generates the correct bundles", async () => {
      let output = await generateBuild(config, {
        mode: BuildMode.Development,
        target: BuildTarget.Browser
      });

      expect(getFilenames(output)).toMatchInlineSnapshot(`
        Array [
          "_shared/Shared-7d084ccf.js",
          "_shared/__babel/runtime-88c72f87.js",
          "_shared/__mdx-js/react-4b004046.js",
          "_shared/__remix-run/react-cf018015.js",
          "_shared/_rollupPluginBabelHelpers-bfa6c712.js",
          "_shared/history-7c196d23.js",
          "_shared/object-assign-510802f4.js",
          "_shared/prop-types-1122a697.js",
          "_shared/react-a3c235ca.js",
          "_shared/react-dom-ec89bb6e.js",
          "_shared/react-is-6b44b080.js",
          "_shared/react-router-dom-ef82d700.js",
          "_shared/react-router-e7697632.js",
          "_shared/scheduler-8fd1645e.js",
          "components/guitar-1080x720-a9c95518.jpg",
          "components/guitar-2048x1365-f42efd6b.jpg",
          "components/guitar-500x333-3a1a0bd1.jpg",
          "components/guitar-500x500-c6f1ab94.jpg",
          "components/guitar-600x600-b329e428.jpg",
          "components/guitar-720x480-729becce.jpg",
          "entry.client.js",
          "manifest-8c53378e.js",
          "pages/one.js",
          "pages/two.js",
          "root.js",
          "routes/404.js",
          "routes/gists.js",
          "routes/gists.mine.js",
          "routes/gists/$username.js",
          "routes/gists/index.js",
          "routes/index.js",
          "routes/links.js",
          "routes/loader-errors.js",
          "routes/loader-errors/nested.js",
          "routes/methods.js",
          "routes/page/four.js",
          "routes/page/three.js",
          "routes/prefs.js",
          "routes/render-errors.js",
          "routes/render-errors/nested.js",
          "styles/app-72f634dc.css",
          "styles/gists-d7ad5f49.css",
          "styles/methods-d182a270.css",
          "styles/redText-2b391c21.css",
        ]
      `);
    });
  });

  describe("the production browser build", () => {
    it("generates the correct bundles", async () => {
      let output = await generateBuild(config, {
        mode: BuildMode.Production,
        target: BuildTarget.Browser
      });

      expect(getFilenames(output)).toMatchInlineSnapshot(`
        Array [
          "_shared/Shared-bae6070c.js",
          "_shared/__babel/runtime-88c72f87.js",
          "_shared/__mdx-js/react-a9edf40b.js",
          "_shared/__remix-run/react-991ebd19.js",
          "_shared/_rollupPluginBabelHelpers-bfa6c712.js",
          "_shared/history-e6417d88.js",
          "_shared/object-assign-510802f4.js",
          "_shared/prop-types-939a16b3.js",
          "_shared/react-dom-9dcf9947.js",
          "_shared/react-e3656f88.js",
          "_shared/react-is-5765fb91.js",
          "_shared/react-router-dom-baf54395.js",
          "_shared/react-router-fc62a14c.js",
          "_shared/scheduler-f1282356.js",
          "components/guitar-1080x720-a9c95518.jpg",
          "components/guitar-2048x1365-f42efd6b.jpg",
          "components/guitar-500x333-3a1a0bd1.jpg",
          "components/guitar-500x500-c6f1ab94.jpg",
          "components/guitar-600x600-b329e428.jpg",
          "components/guitar-720x480-729becce.jpg",
          "entry.client-b7de4be6.js",
          "manifest-943fff78.js",
          "pages/one-829d2fc6.js",
          "pages/two-31b88726.js",
          "root-de6ed2a5.js",
          "routes/404-a4edec5f.js",
          "routes/gists-236207fe.js",
          "routes/gists.mine-ac017552.js",
          "routes/gists/$username-c4819bb8.js",
          "routes/gists/index-0f39313f.js",
          "routes/index-eb238abf.js",
          "routes/links-50cd630a.js",
          "routes/loader-errors-e4502176.js",
          "routes/loader-errors/nested-741a07ef.js",
          "routes/methods-8241c6fa.js",
          "routes/page/four-efa66f69.js",
          "routes/page/three-dfbf7520.js",
          "routes/prefs-12bae83f.js",
          "routes/render-errors-cb72f859.js",
          "routes/render-errors/nested-ef1c619f.js",
          "styles/app-72f634dc.css",
          "styles/gists-d7ad5f49.css",
          "styles/methods-d182a270.css",
          "styles/redText-2b391c21.css",
        ]
      `);
    });
  });
});
