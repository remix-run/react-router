import { Blob, File } from "@web-std/file";

import { FormData as NodeFormData } from "../formData";

describe("FormData", () => {
  it("allows for mix of set and append", () => {
    let formData = new NodeFormData();
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

  it("restores correctly empty string values with get method", () => {
    let formData = new NodeFormData();
    formData.set("single", "");
    expect(formData.get("single")).toBe("");
  });

  it("allows for mix of set and append with blobs and files", () => {
    let formData = new NodeFormData();
    formData.set("single", new Blob([]));
    formData.append("multi", new Blob([]));
    formData.append("multi", new File([], "test.txt"));

    expect(formData.getAll("single")).toHaveLength(1);
    expect(formData.getAll("multi")).toHaveLength(2);
  });
});
