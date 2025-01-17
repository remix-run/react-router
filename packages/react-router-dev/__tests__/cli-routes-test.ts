import path from "node:path";
import execa from "execa";

async function runCli(cwd: string, args: string[]) {
  return await execa(
    "node",
    [
      "--require",
      require.resolve("esbuild-register"),
      path.resolve(__dirname, "../cli/index.ts"),
      ...args,
    ],
    { cwd }
  );
}

describe("the routes command", () => {
  it("displays routes", async () => {
    let projectDir = path.join(__dirname, "fixtures", "basic");

    let result = await runCli(projectDir, ["routes"]);

    expect(result.stdout).toMatchInlineSnapshot(`
      "<Routes>
        <Route file="root.tsx">
          <Route index file="routes/_index.tsx" />
        </Route>
      </Routes>"
    `);
  });
});
