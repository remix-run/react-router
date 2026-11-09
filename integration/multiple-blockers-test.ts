import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import getPort from "get-port";
import {
  createFixture,
  createAppFixture,
  js,
} from "./helpers/create-fixture.js";
import { implementations, setupRscTest } from "./rsc/utils.js";

const guarded = js`
  "use client";
  import { useEffect, useState } from "react";
  import { Link, useBlocker, useNavigate } from "react-router";

  function Guard({ name }) {
    let blocker = useBlocker(true);
    useEffect(() => {
      window.__blockers ??= {};
      window.__blockers[name] = blocker;
    }, [blocker]);
    return <section>
      <p data-testid={name}>{name}:{blocker.state}</p>
      {blocker.state === "blocked" && <>
        <button onClick={blocker.proceed}>Approve {name}</button>
        <button onClick={blocker.reset}>Cancel {name}</button>
      </>}
    </section>;
  }
  export function Links() {
    return <nav>{["a", "b", "c", "d"].map(path =>
      <Link key={path} to={"/" + path}>{path.toUpperCase()}</Link>
    )}</nav>;
  }
  export default function Guarded() {
    let navigate = useNavigate();
    let [show, setShow] = useState(true);
    useEffect(() => { window.__navigate = navigate; }, [navigate]);
    return <>
      <h1>C</h1><Links />
      {show && <><Guard name="A"/><Guard name="B"/></>}
      <button onClick={() => setShow(false)}>Remove guards</button>
    </>;
  }
`;

function fixtureFiles(enabled: boolean) {
  return {
    "react-router.config.ts": js`
      export default { future: { unstable_multipleBlockers: ${enabled} } };
    `,
    "app/guarded.tsx": guarded,
    "app/routes/c.tsx": js`export { default } from "../guarded";`,
    ...Object.fromEntries(
      ["a", "b", "d"].map((path) => [
        `app/routes/${path}.tsx`,
        js`
        import { Links } from "../guarded";
        export default function Page() { return <><h1>${path.toUpperCase()}</h1><Links /></>; }
      `,
      ]),
    ),
  };
}

async function assertSerialPop(page: Page, origin: string) {
  let errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${origin}/a`);
  await page.getByRole("link", { name: "B", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "B", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "C", exact: true }).click();
  await expect(page.getByTestId("A")).toHaveText("A:unblocked");

  await page.goBack();
  await expect(page.getByTestId("A")).toHaveText("A:blocked");
  await expect(page).toHaveURL(`${origin}/c`);
  await page.getByRole("button", { name: "Approve A" }).click();
  await expect(page.getByTestId("A")).toHaveText("A:unblocked");
  await expect(page.getByTestId("B")).toHaveText("B:blocked");
  await page.getByRole("button", { name: "Cancel B" }).click();
  await expect(page).toHaveURL(`${origin}/c`);

  await page.goBack();
  await expect(page.getByTestId("A")).toHaveText("A:blocked");
  await page.getByRole("button", { name: "Approve A" }).click();
  await page.getByRole("button", { name: "Approve B" }).click();
  await expect(
    page.getByRole("heading", { name: "B", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(`${origin}/b`);
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "C", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(`${origin}/c`);
  expect(errors).toEqual([]);
}

for (let [mode, templateName] of [
  ["Framework", "vite-7-template"],
  ["RSC Framework", "rsc-vite-framework"],
] as const) {
  for (let enabled of [false, true]) {
    test(`${mode} multiple blockers flag ${enabled}`, async ({ page }) => {
      let fixture = await createFixture({
        templateName,
        files: fixtureFiles(enabled),
      });
      let app = await createAppFixture(fixture);
      try {
        if (enabled) {
          await assertSerialPop(page, app.serverUrl);
        } else {
          await page.goto(`${app.serverUrl}/c`);
          await page.getByRole("link", { name: "D", exact: true }).click();
          await expect(page.getByTestId("B")).toHaveText("B:blocked");
          await expect(page.getByTestId("A")).toHaveText("A:unblocked");
        }
      } finally {
        await app.close();
      }
    });
  }
}

test("Data multiple blockers use browser history", async ({ page }) => {
  let fixture = await createFixture({
    files: {
      ...fixtureFiles(false),
      "app/root.tsx": js`
      import { Links, Scripts } from "react-router";
      export default function Root() {
        return <html><head><Links /></head><body><div id="app"/><Scripts /></body></html>;
      }
    `,
      "app/entry.client.tsx": js`
      import { createRoot } from "react-dom/client";
      import { createBrowserRouter, RouterProvider } from "react-router";
      import Guarded, { Links } from "./guarded";
      let router = createBrowserRouter(["a", "b", "c", "d"].map(path => ({
        path: "/" + path,
        element: path === "c" ? <Guarded/> : <><h1>{path.toUpperCase()}</h1><Links/></>,
      })), { future: { unstable_multipleBlockers: true } });
      createRoot(document.getElementById("app")).render(<RouterProvider router={router}/>);
    `,
    },
  });
  let app = await createAppFixture(fixture);
  try {
    await assertSerialPop(page, app.serverUrl);
  } finally {
    await app.close();
  }
});

test("RSC Data forwards the client future prop", async ({ page }) => {
  let implementation = implementations[0];
  let port = await getPort();
  let browserEntry = await readFile(
    new URL("./helpers/rsc-vite/src/entry.browser.tsx", import.meta.url),
    "utf8",
  );
  let stop = await setupRscTest({
    implementation,
    port,
    files: {
      "src/entry.browser.tsx": browserEntry.replace(
        "<RSCHydratedRouter",
        "<RSCHydratedRouter future={{ unstable_multipleBlockers: true }}",
      ),
      "src/guarded.tsx": guarded,
      "src/routes.ts": js`
      export const routes = [{ id: "root", path: "", lazy: () => import("./routes/root"), children: [
        { id: "a", path: "a", lazy: () => import("./routes/a") },
        { id: "b", path: "b", lazy: () => import("./routes/b") },
        { id: "c", path: "c", lazy: () => import("./routes/c") },
        { id: "d", path: "d", lazy: () => import("./routes/d") },
      ]}];
    `,
      "src/routes/c.tsx": js`export { default } from "../guarded";`,
      ...Object.fromEntries(
        ["a", "b", "d"].map((path) => [
          `src/routes/${path}.tsx`,
          js`
        import { Links } from "../guarded";
        export default function Page() { return <><h1>${path.toUpperCase()}</h1><Links/></>; }
      `,
        ]),
      ),
    },
  });
  try {
    await assertSerialPop(page, `http://localhost:${port}`);
  } finally {
    stop();
  }
});

test("native prompts confirm sequentially and cancel the whole attempt", async ({
  page,
}) => {
  let fixture = await createFixture({
    files: {
      ...fixtureFiles(true),
      "app/guarded.tsx": js`
        import { Link, unstable_usePrompt as usePrompt } from "react-router";
        export function Links() { return <Link to="/d">D</Link>; }
        export default function Guarded() {
          usePrompt({ when: true, message: "Leave Profile?" });
          usePrompt({ when: true, message: "Leave Notes?" });
          return <><h1>C</h1><Links /></>;
        }
      `,
    },
  });
  let app = await createAppFixture(fixture);
  try {
    await page.goto(`${app.serverUrl}/c`);
    let messages: string[] = [];
    let approve = false;
    page.on("dialog", async (dialog) => {
      messages.push(dialog.message());
      if (approve) await dialog.accept();
      else await dialog.dismiss();
    });
    await page.getByRole("link", { name: "D", exact: true }).click();
    await expect(page).toHaveURL(`${app.serverUrl}/c`);
    expect(messages).toEqual(["Leave Profile?"]);

    approve = true;
    await page.getByRole("link", { name: "D", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "D", exact: true }),
    ).toBeVisible();
    expect(messages).toEqual([
      "Leave Profile?",
      "Leave Profile?",
      "Leave Notes?",
    ]);
    await expect(page).toHaveURL(`${app.serverUrl}/d`);
  } finally {
    await app.close();
  }
});

test("a new request after native replay restores C before pushing D", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let held: PopStateEvent | undefined;
    Object.assign(window, {
      __holdPop: false,
      __releasePop: () => {
        if (held) {
          let event = held;
          held = undefined;
          window.dispatchEvent(event);
        }
      },
    });
    window.addEventListener(
      "popstate",
      (event) => {
        if ((window as any).__holdPop) {
          (window as any).__holdPop = false;
          held = new PopStateEvent("popstate", { state: event.state });
          event.stopImmediatePropagation();
        }
      },
      true,
    );
  });
  let fixture = await createFixture({ files: fixtureFiles(true) });
  let app = await createAppFixture(fixture);
  try {
    await page.goto(`${app.serverUrl}/a`);
    await page.getByRole("link", { name: "B", exact: true }).click();
    await page.getByRole("link", { name: "C", exact: true }).click();
    await expect(page.getByTestId("A")).toHaveText("A:unblocked");
    await page.goBack();
    await expect(page.getByTestId("A")).toHaveText("A:blocked");
    await expect(page).toHaveURL(`${app.serverUrl}/c`);
    await page.getByRole("button", { name: "Approve A" }).click();
    await page.evaluate(() => {
      (window as any).__holdPop = true;
    });
    await page.getByRole("button", { name: "Approve B" }).click();
    await expect(page).toHaveURL(`${app.serverUrl}/b`);
    await expect(
      page.getByRole("heading", { name: "C", exact: true }),
    ).toBeVisible();
    await page.evaluate(() => {
      void (window as any).__navigate("/d");
      (window as any).__releasePop();
    });
    await expect(page.getByTestId("A")).toHaveText("A:blocked");
    await expect(page).toHaveURL(`${app.serverUrl}/c`);
    await page.getByRole("button", { name: "Approve A" }).click();
    await page.getByRole("button", { name: "Approve B" }).click();
    await expect(page).toHaveURL(`${app.serverUrl}/d`);
    await page.goBack();
    await expect(
      page.getByRole("heading", { name: "C", exact: true }),
    ).toBeVisible();
    await expect(page).toHaveURL(`${app.serverUrl}/c`);
  } finally {
    await app.close();
  }
});
