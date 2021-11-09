import { RemixFormData as FormData } from "../form-data";

describe("FormData", () => {
  it("allows for mix of set and append", () => {
    let formData = new FormData();
    formData.set("single", "heyo");
    formData.append("multi", "one");
    formData.append("multi", "two");

    let results = [];
    for (let [k, v] of formData) results.push([k, v]);
    expect(results).toEqual([
      ["single", "heyo"],
      ["multi", "one"],
      ["multi", "two"]
    ]);
  });
});
