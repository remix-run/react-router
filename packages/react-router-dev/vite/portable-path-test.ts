import path from "node:path";

import { toPortablePath } from "./portable-path";

describe("toPortablePath", () => {
  test("converts Windows path separators to portable slashes", () => {
    expect(
      toPortablePath(path.win32.relative("C:\\app", "C:\\app\\build\\client")),
    ).toBe("build/client");
  });

  test("preserves relative parent segments", () => {
    expect(
      toPortablePath(
        path.win32.relative("C:\\app\\build\\server", "C:\\app\\build\\client"),
      ),
    ).toBe("../client");
  });

  test("preserves POSIX paths", () => {
    expect(
      toPortablePath(path.posix.relative("/app", "/app/build/client")),
    ).toBe("build/client");
  });
});
