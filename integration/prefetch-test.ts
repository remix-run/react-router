import { createAppFixture, createFixture, js } from "./helpers/create-fixture";
import type { Fixture, AppFixture } from "./helpers/create-fixture";

// Generate the test app using the given prefetch mode
function fixtureFactory(mode) {
  return {
    files: {
      "app/root.jsx": js`
        import { Link, Links, Meta, Outlet, Scripts, useLoaderData } from "remix";

        export default function Root() {
          const styles =
          'a:hover { color: red; } a:hover:after { content: " (hovered)"; }' +
          'a:focus { color: green; } a:focus:after { content: " (focused)"; }';

          return (
            <html lang="en">
              <head>
                <Meta />
                <Links />
              </head>
              <body>
                <style>{styles}</style>
                <h1>Root</h1>
                <nav id="nav">
                  <Link to="/with-loader" prefetch="${mode}">
                    Loader Page
                  </Link>
                  <br/>
                  <Link to="/without-loader" prefetch="${mode}">
                    Non-Loader Page
                  </Link>
                </nav>
                <Outlet />
                <Scripts />
              </body>
            </html>
          );
        }
      `,

      "app/routes/index.jsx": js`
        export default function() {
          return <h2>Index</h2>;
        }
      `,

      "app/routes/with-loader.jsx": js`
        export function loader() {
          return { message: 'data from the loader' };
        }
        export default function() {
          return <h2>With Loader</h2>;
        }
      `,

      "app/routes/without-loader.jsx": js`
        export default function() {
          return <h2>Without Loader</h2>;
        }
      `,
    },
  };
}

describe("prefetch=none", () => {
  let fixture: Fixture;
  let app: AppFixture;

  beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("none"));
    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not render prefetch tags during SSR", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect((await app.page.$$("#nav link")).length).toBe(0);
  });

  it("does not add prefetch tags on hydration", async () => {
    await app.goto("/");
    expect((await app.page.$$("#nav link")).length).toBe(0);
  });
});

describe("prefetch=render", () => {
  let fixture: Fixture;
  let app: AppFixture;

  beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("render"));
    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not render prefetch tags during SSR", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect((await app.page.$$("#nav link")).length).toBe(0);
  });

  it("adds prefetch tags on hydration", async () => {
    await app.goto("/");
    // Both data and asset fetch for /with-loader
    await app.page.waitForSelector(
      "#nav link[rel='prefetch'][as='fetch'][href='/with-loader?_data=routes%2Fwith-loader']"
    );
    await app.page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/with-loader-']"
    );
    // Only asset fetch for /without-loader
    await app.page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/without-loader-']"
    );

    // Ensure no other links in the #nav element
    expect((await app.page.$$("#nav link")).length).toBe(3);
  });
});

describe("prefetch=intent (hover)", () => {
  let fixture: Fixture;
  let app: AppFixture;

  beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("intent"));
    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not render prefetch tags during SSR", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect((await app.page.$$("#nav link")).length).toBe(0);
  });

  it("does not add prefetch tags on hydration", async () => {
    await app.goto("/");
    expect((await app.page.$$("#nav link")).length).toBe(0);
  });

  it("adds prefetch tags on hover", async () => {
    await app.page.hover("a[href='/with-loader']");
    await app.page.waitForSelector(
      "#nav link[rel='prefetch'][as='fetch'][href='/with-loader?_data=routes%2Fwith-loader']"
    );
    // Check href prefix due to hashed filenames
    await app.page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/with-loader-']"
    );
    expect((await app.page.$$("#nav link")).length).toBe(2);

    await app.page.hover("a[href='/without-loader']");
    await app.page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/without-loader-']"
    );
    expect((await app.page.$$("#nav link")).length).toBe(3);
  });
});

describe("prefetch=intent (focus)", () => {
  let fixture: Fixture;
  let app: AppFixture;

  beforeAll(async () => {
    fixture = await createFixture(fixtureFactory("intent"));
    app = await createAppFixture(fixture);
  });

  afterAll(async () => {
    await app.close();
  });

  it("does not render prefetch tags during SSR", async () => {
    let res = await fixture.requestDocument("/");
    expect(res.status).toBe(200);
    expect((await app.page.$$("#nav link")).length).toBe(0);
  });

  it("does not add prefetch tags on hydration", async () => {
    await app.goto("/");
    expect((await app.page.$$("#nav link")).length).toBe(0);
  });

  it("adds prefetch tags on focus", async () => {
    // This click is needed to transfer focus to the main window, allowing
    // subsequent focus events to fire
    await app.page.click("body");
    await app.page.focus("a[href='/with-loader']");
    await app.page.waitForSelector(
      "#nav link[rel='prefetch'][as='fetch'][href='/with-loader?_data=routes%2Fwith-loader']"
    );
    // Check href prefix due to hashed filenames
    await app.page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/with-loader-']"
    );
    expect((await app.page.$$("#nav link")).length).toBe(2);

    await app.page.focus("a[href='/without-loader']");
    await app.page.waitForSelector(
      "#nav link[rel='modulepreload'][href^='/build/routes/without-loader-']"
    );
    expect((await app.page.$$("#nav link")).length).toBe(3);
  });
});
