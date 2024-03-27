import * as path from "node:path";
import { test, expect } from "@playwright/test";

import { createProject, grep, viteBuild } from "./helpers/vite.js";

let files = {
  "app/utils.client.ts": String.raw`
    export const dotClientFile = "CLIENT_ONLY_FILE";
    export default dotClientFile;
  `,
  "app/.client/utils.ts": String.raw`
    export const dotClientDir = "CLIENT_ONLY_DIR";
    export default dotClientDir;
  `,
};

test("Vite / client code excluded from server bundle", async () => {
  let cwd = await createProject({
    ...files,
    "app/routes/dot-client-imports.tsx": String.raw`
      import { dotClientFile } from "../utils.client";
      import { dotClientDir } from "../.client/utils";

      export default function() {
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
          setMounted(true);
        }, []);

        return (
          <>
            <h2>Index</h2>
            <p>{mounted ? dotClientFile + dotClientDir : ""}</p>
          </>
        );
      }
    `,
  });
  let { status } = viteBuild({ cwd });
  expect(status).toBe(0);
  let lines = grep(
    path.join(cwd, "build/server"),
    /CLIENT_ONLY_FILE|CLIENT_ONLY_DIR/
  );
  expect(lines).toHaveLength(0);
});
