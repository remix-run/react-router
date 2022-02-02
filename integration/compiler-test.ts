import { createFixture, createAppFixture } from "./helpers/create-fixture";

describe("compiler", () => {
  it("removes server code with `*.server` files", async () => {
    let fixture = await createFixture({
      files: {
        "app/fake.server.js": `
          import fs from "fs";
          export default fs;
        `,

        "app/routes/index.jsx": `
          import fs from "~/fake.server.js";

          export default function Index() {
            return <div id="index">{Object.keys(fs).length}</div>
          }
        `
      }
    });

    let app = await createAppFixture(fixture);

    let res = await app.goto("/");
    expect(res.status()).toBe(200); // server rendered fine

    // rendered the page instead of the error boundary
    expect(await app.getHtml("#index")).toMatchInlineSnapshot(
      `"<div id=\\"index\\">0</div>"`
    );

    await app.close();
  });
});
