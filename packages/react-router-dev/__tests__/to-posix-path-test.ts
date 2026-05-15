import { toPosixPath } from "../vite/to-posix-path";

describe("toPosixPath", () => {
  it("normalizes Windows path separators", () => {
    expect(toPosixPath("build\\client\\assets")).toBe("build/client/assets");
  });

  it("leaves POSIX path separators unchanged", () => {
    expect(toPosixPath("build/client/assets")).toBe("build/client/assets");
  });
});
