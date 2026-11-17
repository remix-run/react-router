import fs from "node:fs/promises";
import os from "node:os";
import * as path from "pathe";

import { watch } from "../typegen/index";

it.each([false, true])(
  "uses the latest routes after waiting for the startup lock (rsc=%s)",
  async (rsc) => {
    let root = await fs.mkdtemp(path.join(os.tmpdir(), "rr-typegen-startup-"));
    let lockPath = path.join(root, ".react-router/.typegen.lock");
    let routesPath = path.join(root, "app/routes.ts");
    let startup: ReturnType<typeof watch> | undefined;
    try {
      await fs.mkdir(path.join(root, "app"));
      await fs.mkdir(path.dirname(lockPath));
      await fs.writeFile(lockPath, String(process.pid));
      await fs.writeFile(path.join(root, "package.json"), '{"type":"module"}');
      for (let name of ["root", "a", "b"]) {
        await fs.writeFile(
          path.join(root, `app/${name}.tsx`),
          "export default function Page() { return null; }",
        );
      }
      let routes = (name: string) =>
        `export default [{ path: "${name}", file: "${name}.tsx" }];`;
      await fs.writeFile(routesPath, routes("a"));

      let waiting!: () => void;
      let blocked = new Promise<void>((resolve) => (waiting = resolve));
      let open = fs.open;
      jest.spyOn(fs, "open").mockImplementation(async (...args) => {
        try {
          return await open(...args);
        } catch (error) {
          if (
            args[0] === lockPath &&
            (error as NodeJS.ErrnoException).code === "EEXIST"
          ) {
            waiting();
          }
          throw error;
        }
      });
      startup = watch(root, { mode: "development", rsc });
      // Observe contention directly instead of assuming a config-loading delay.
      await Promise.race([
        blocked,
        startup.then(() => {
          throw new Error("Typegen startup completed while the lock was held");
        }),
      ]);
      await fs.writeFile(routesPath, routes("b"));
      await fs.rm(lockPath);
      await startup;

      let generated = await fs.readFile(
        path.join(root, ".react-router/types/+routes.ts"),
        "utf8",
      );
      expect(generated).toContain('"/b"');
      expect(generated).not.toContain('"/a"');
    } finally {
      await fs.rm(lockPath, { force: true });
      let watcher = await startup?.catch(() => undefined);
      await watcher?.close();
      jest.restoreAllMocks();
      await fs.rm(root, { recursive: true, force: true });
    }
  },
);
