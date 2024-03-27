import { test } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.describe("v1 compiler", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/parent.tsx": js`
          import { createContext, useContext } from "react";
          import { Outlet } from "@remix-run/react";
  
          const ParentContext = createContext("❌");
  
          export function useParentContext() {
            return useContext(ParentContext);
          }
  
          export default function Index() {
            return (
              <ParentContext.Provider value="✅">
                <Outlet />
              </ParentContext.Provider>
            )
          }
        `,

        "app/routes/parent.child.tsx": js`
          import { useParentContext } from "./parent";
  
          export default function Index() {
            return <p>{useParentContext()}</p>;
          }
        `,

        "app/routes/markdown-parent.mdx": `import { createContext, useContext } from 'react';
import { Outlet } from '@remix-run/react';

export const ParentContext = createContext("❌");

export function useParentContext() {
  return useContext(ParentContext);
}

export function ParentProvider() {
  return (
    <ParentContext.Provider value="✅">
      <Outlet />
    </ParentContext.Provider>
  );
}

<ParentProvider />
`,
        "app/routes/markdown-parent.child.mdx": `import { useParentContext } from "./markdown-parent.mdx";

export function UseParentContext() {
  return <p>{useParentContext()}</p>;
}

<UseParentContext />
`,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("should render context value from context provider", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/parent/child", true);

    await page.waitForSelector("p:has-text('✅')");
  });

  test("should render context value from context provider exported from mdx", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/markdown-parent/child", true);

    await page.waitForSelector("p:has-text('✅')");
  });
});

test.describe("v2 compiler", () => {
  test.beforeAll(async () => {
    fixture = await createFixture({
      files: {
        "app/routes/parent.tsx": js`
          import { createContext, useContext } from "react";
          import { Outlet } from "@remix-run/react";
  
          const ParentContext = createContext("❌");
  
          export function useParentContext() {
            return useContext(ParentContext);
          }
  
          export default function Index() {
            return (
              <ParentContext.Provider value="✅">
                <Outlet />
              </ParentContext.Provider>
            )
          }
        `,

        "app/routes/parent.child.tsx": js`
          import { useParentContext } from "./parent";
  
          export default function Index() {
            return <p>{useParentContext()}</p>;
          }
        `,

        "app/routes/markdown-parent.mdx": `import { createContext, useContext } from 'react';
import { Outlet } from '@remix-run/react';

export const ParentContext = createContext("❌");

export function useParentContext() {
  return useContext(ParentContext);
}

export function ParentProvider() {
  return (
    <ParentContext.Provider value="✅">
      <Outlet />
    </ParentContext.Provider>
  );
}

<ParentProvider />
`,
        "app/routes/markdown-parent.child.mdx": `import { useParentContext } from "./markdown-parent.mdx";

export function UseParentContext() {
  const value = useParentContext();
  return (
    <p>{value}</p>
  );
}

<UseParentContext />
`,
      },
    });

    appFixture = await createAppFixture(fixture);
  });

  test.afterAll(() => {
    appFixture.close();
  });

  test("should render context value from context provider", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/parent/child", true);

    await page.waitForSelector("p:has-text('✅')");
  });

  test("should render context value from context provider exported from mdx", async ({
    page,
  }) => {
    let app = new PlaywrightFixture(appFixture, page);
    await app.goto("/markdown-parent/child", true);

    await page.waitForSelector("p:has-text('✅')");
  });
});
