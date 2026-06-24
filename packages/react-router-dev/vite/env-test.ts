import { disableViteEnvFileLoading } from "./env";

describe("disableViteEnvFileLoading", () => {
  test("uses envFile on Vite 7", () => {
    expect(
      disableViteEnvFileLoading({
        version: "7.2.0",
      } as Parameters<typeof disableViteEnvFileLoading>[0]),
    ).toEqual({ envFile: false });
  });

  test("uses envDir on Vite 8", () => {
    expect(
      disableViteEnvFileLoading({
        version: "8.1.0",
      } as Parameters<typeof disableViteEnvFileLoading>[0]),
    ).toEqual({ envDir: false });
  });
});
