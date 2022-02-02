import { createFixture, js } from "./helpers/create-fixture";

describe("loader export", () => {
  it("returns responses for a specific route", async () => {
    const ROOT_DATA = "ROOT_DATA";
    const INDEX_DATA = "INDEX_DATA";

    let fixture = await createFixture({
      files: {
        "app/root.jsx": js`
          import { Outlet } from "remix";

          export function loader() {
            return "${ROOT_DATA}"
          }

          export default function Index() {
            return <html><body><Outlet/></body></html>
          }
        `,

        "app/routes/index.jsx": js`
          import { json } from "remix";

          export function loader() {
            return "${INDEX_DATA}"
          }

          export default function Index() {
            return <div/>
          }
        `
      }
    });

    let [root, index] = await Promise.all([
      fixture.requestData("/", "root"),
      fixture.requestData("/", "routes/index")
    ]);

    expect(root.headers.get("Content-Type")).toBe(
      "application/json; charset=utf-8"
    );

    expect(await root.json()).toBe(ROOT_DATA);
    expect(await index.json()).toBe(INDEX_DATA);
  });
});
