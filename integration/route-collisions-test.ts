import { PassThrough } from "node:stream";
import { test, expect } from "@playwright/test";

import { createFixture, js } from "./helpers/create-fixture.js";

let ROOT_FILE_CONTENTS = js`
  import { Outlet, Scripts } from "@remix-run/react";

  export default function App() {
    return (
      <html lang="en">
        <body>
          <Outlet />
          <Scripts />
        </body>
      </html>
    );
  }
`;

let LAYOUT_FILE_CONTENTS = js`
  import { Outlet } from "@remix-run/react";

  export default function Layout() {
    return <Outlet />
  }
`;

let LEAF_FILE_CONTENTS = js`
  export default function Foo() {
    return <h1>Foo</h1>;
  }
`;

test.describe("build failures", () => {
  let originalConsoleLog = console.log;
  let originalConsoleWarn = console.warn;
  let originalConsoleError = console.error;

  test.beforeAll(async () => {
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  });

  test.afterAll(() => {
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
  });

  async function setup(files: Record<string, string>) {
    let buildStdio = new PassThrough();
    let buildOutput: string;
    await createFixture({
      buildStdio,
      files,
    });
    let chunks: Buffer[] = [];
    buildOutput = await new Promise<string>((resolve, reject) => {
      buildStdio.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      buildStdio.on("error", (err) => reject(err));
      buildStdio.on("end", () =>
        resolve(Buffer.concat(chunks).toString("utf8"))
      );
    });
    return buildOutput;
  }

  test("detects path collisions inside pathless layout routes", async () => {
    let buildOutput = await setup({
      "app/root.tsx": ROOT_FILE_CONTENTS,
      "app/routes/foo.jsx": LEAF_FILE_CONTENTS,
      "app/routes/_pathless.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/_pathless.foo.jsx": LEAF_FILE_CONTENTS,
    });
    expect(buildOutput).toContain(`⚠️ Route Path Collision: "/foo"`);
    expect(buildOutput).toContain(`🟢 routes/_pathless.foo.jsx`);
    expect(buildOutput).toContain(`⭕️️ routes/foo.jsx`);
  });

  test("detects path collisions across pathless layout routes", async () => {
    let buildOutput = await setup({
      "app/root.tsx": ROOT_FILE_CONTENTS,
      "app/routes/_pathless.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/_pathless.foo.jsx": LEAF_FILE_CONTENTS,
      "app/routes/_pathless2.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/_pathless2.foo.jsx": LEAF_FILE_CONTENTS,
    });
    expect(buildOutput).toContain(`⚠️ Route Path Collision: "/foo"`);
    expect(buildOutput).toContain(`🟢 routes/_pathless2.foo.jsx`);
    expect(buildOutput).toContain(`⭕️️ routes/_pathless.foo.jsx`);
  });

  test("detects path collisions inside multiple pathless layout routes", async () => {
    let buildOutput = await setup({
      "app/root.tsx": ROOT_FILE_CONTENTS,
      "app/routes/foo.jsx": LEAF_FILE_CONTENTS,
      "app/routes/_pathless.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/_pathless._again.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/_pathless._again.foo.jsx": LEAF_FILE_CONTENTS,
    });
    expect(buildOutput).toContain(`⚠️ Route Path Collision: "/foo"`);
    expect(buildOutput).toContain(`🟢 routes/_pathless._again.foo.jsx`);
    expect(buildOutput).toContain(`⭕️️ routes/foo.jsx`);
  });

  test("detects path collisions of index files inside pathless layouts", async () => {
    let buildOutput = await setup({
      "app/root.tsx": ROOT_FILE_CONTENTS,
      "app/routes/_index.jsx": LEAF_FILE_CONTENTS,
      "app/routes/_pathless.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/_pathless._index.jsx": LEAF_FILE_CONTENTS,
    });
    expect(buildOutput).toContain(`⚠️ Route Path Collision: "/"`);
    expect(buildOutput).toContain(`🟢 routes/_pathless._index.jsx`);
    expect(buildOutput).toContain(`⭕️️ routes/_index.jsx`);
  });

  test("detects path collisions of index files across multiple pathless layouts", async () => {
    let buildOutput = await setup({
      "app/root.tsx": ROOT_FILE_CONTENTS,
      "app/routes/nested._pathless.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/nested._pathless._index.jsx": LEAF_FILE_CONTENTS,
      "app/routes/nested._oops.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/nested._oops._index.jsx": LEAF_FILE_CONTENTS,
    });
    expect(buildOutput).toContain(`⚠️ Route Path Collision: "/nested"`);
    expect(buildOutput).toContain(`🟢 routes/nested._pathless._index.jsx`);
    expect(buildOutput).toContain(`⭕️️ routes/nested._oops._index.jsx`);
  });

  test("detects path collisions of param routes inside pathless layouts", async () => {
    let buildOutput = await setup({
      "app/root.tsx": ROOT_FILE_CONTENTS,
      "app/routes/$param.jsx": LEAF_FILE_CONTENTS,
      "app/routes/_pathless.jsx": LAYOUT_FILE_CONTENTS,
      "app/routes/_pathless.$param.jsx": LEAF_FILE_CONTENTS,
    });
    expect(buildOutput).toContain(`⚠️ Route Path Collision: "/:param"`);
    expect(buildOutput).toContain(`🟢 routes/_pathless.$param.jsx`);
    expect(buildOutput).toContain(`⭕️️ routes/$param.jsx`);
  });
});
