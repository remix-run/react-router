import { PassThrough } from "stream";

import { Request } from "../fetch";
import { createMemoryUploadHandler } from "../upload/memoryUploadHandler";

let test = {
  source: [
    [
      "-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k",
      'Content-Disposition: form-data; name="file_name_0"',
      "",
      "super alpha file",
      "-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k",
      'Content-Disposition: form-data; name="file_name_1"',
      "",
      "super beta file",
      "-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k",
      'Content-Disposition: form-data; name="upload_file_0"; filename="1k_a.dat"',
      "Content-Type: application/octet-stream",
      "",
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      "-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k",
      'Content-Disposition: form-data; name="upload_file_1"; filename="1k_b.dat"',
      "Content-Type: application/octet-stream",
      "",
      "BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      "-----------------------------paZqsnEHRufoShdX6fh0lUhXBP4k--"
    ].join("\r\n")
  ],
  boundary: "---------------------------paZqsnEHRufoShdX6fh0lUhXBP4k",
  expected: [
    [
      "field",
      "file_name_0",
      "super alpha file",
      false,
      false,
      "7bit",
      "text/plain"
    ],
    [
      "field",
      "file_name_1",
      "super beta file",
      false,
      false,
      "7bit",
      "text/plain"
    ],
    [
      "file",
      "upload_file_0",
      1023,
      0,
      "1k_a.dat",
      "7bit",
      "application/octet-stream"
    ],
    [
      "file",
      "upload_file_1",
      1023,
      0,
      "1k_b.dat",
      "7bit",
      "application/octet-stream"
    ]
  ],
  what: "Fields and files"
};

describe("Request", () => {
  let uploadHandler = createMemoryUploadHandler({});

  it("clones", async () => {
    let body = new PassThrough();
    test.source.forEach(chunk => body.write(chunk));

    let req = new Request("http://test.com", {
      method: "post",
      body,
      headers: {
        "Content-Type": "multipart/form-data; boundary=" + test.boundary
      }
    });

    let cloned = req.clone();
    expect(Object.getPrototypeOf(req)).toBe(Object.getPrototypeOf(cloned));

    let formData = await req.formData(uploadHandler);
    let clonedFormData = await cloned.formData(uploadHandler);

    expect(formData.get("file_name_0")).toBe("super alpha file");
    expect(clonedFormData.get("file_name_0")).toBe("super alpha file");
    expect(formData.get("file_name_1")).toBe("super beta file");
    expect(clonedFormData.get("file_name_1")).toBe("super beta file");
    let file = formData.get("upload_file_0") as File;
    expect(file.name).toBe("1k_a.dat");
    expect(file.size).toBe(1023);
    file = clonedFormData.get("upload_file_0") as File;
    expect(file.name).toBe("1k_a.dat");
    expect(file.size).toBe(1023);

    file = formData.get("upload_file_1") as File;
    expect(file.name).toBe("1k_b.dat");
    expect(file.size).toBe(1023);
    file = clonedFormData.get("upload_file_1") as File;
    expect(file.name).toBe("1k_b.dat");
    expect(file.size).toBe(1023);
  });
});
