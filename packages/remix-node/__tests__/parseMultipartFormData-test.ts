import { Blob, File } from "@web-std/file";

import { Request as NodeRequest } from "../fetch";
import { FormData as NodeFormData } from "../formData";
import { internalParseFormData } from "../parseMultipartFormData";
import { createMemoryUploadHandler } from "../upload/memoryUploadHandler";

describe("internalParseFormData", () => {
  it("plays nice with node-fetch", async () => {
    let formData = new NodeFormData();
    formData.set("a", "value");
    formData.set("blob", new Blob(["blob"]), "blob.txt");
    formData.set("file", new File(["file"], "file.txt"));

    let req = new NodeRequest("https://test.com", {
      method: "post",
      body: formData as any
    });

    let uploadHandler = createMemoryUploadHandler({});
    let parsedFormData = await internalParseFormData(
      req.headers.get("Content-Type"),
      req.body as any,
      undefined,
      uploadHandler
    );

    expect(parsedFormData.get("a")).toBe("value");
    let blob = parsedFormData.get("blob") as Blob;
    expect(await blob.text()).toBe("blob");
    let file = parsedFormData.get("file") as File;
    expect(file.name).toBe("file.txt");
    expect(await file.text()).toBe("file");
  });
});
