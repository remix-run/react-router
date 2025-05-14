import { getRelativePathName } from "../vite/plugin";

describe("getRelativePathName", () => {
   it("validates with relative url", () => {
      const url = "/relative/path";
      expect(getRelativePathName(url)).toBe(url);
   });
   
  it("validates with absolute url", () => {
      const uri = "/absolute/path";
      const url = `http://localhost${uri}`;
      expect(getRelativePathName(url)).toBe(uri);
   });
});