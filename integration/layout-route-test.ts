import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { AppFixture } from "./helpers/create-fixture";

describe("pathless layout routes", () => {
  let app: AppFixture;

  beforeAll(async () => {
    app = await createAppFixture(
      await createFixture({
        files: {
          "app/routes/__layout.jsx": js`
            import { Outlet } from "@remix-run/react";

            export default () => <div data-testid="layout-route"><Outlet /></div>;
          `,
          "app/routes/__layout/index.jsx": js`
            export default () => <div data-testid="layout-index">Layout index</div>;
          `,
          "app/routes/__layout/subroute.jsx": js`
            export default () => <div data-testid="layout-subroute">Layout subroute</div>;
          `,
          "app/routes/sandwiches/__pathless.jsx": js`
            import { Outlet } from "@remix-run/react";

            export default () => <div data-testid="sandwiches-pathless-route"><Outlet /></div>;
          `,
          "app/routes/sandwiches/__pathless/index.jsx": js`
            export default () => <div data-testid="sandwiches-pathless-index">Sandwiches pathless index</div>;
          `,
        },
      })
    );
  });

  afterAll(async () => {
    await app?.close();
  });

  it("should render pathless index route", async () => {
    await app.goto("/");
    await app.page.waitForSelector("[data-testid='layout-route']");
    await app.page.waitForSelector("[data-testid='layout-index']");
  });

  it("should render pathless sub route", async () => {
    await app.goto("/subroute");
    await app.page.waitForSelector("[data-testid='layout-route']");
    await app.page.waitForSelector("[data-testid='layout-subroute']");
  });

  it("should render pathless index as a sub route", async () => {
    await app.goto("/sandwiches");
    await app.page.waitForSelector("[data-testid='sandwiches-pathless-route']");
    await app.page.waitForSelector("[data-testid='sandwiches-pathless-index']");
  });
});
