import { parseMultipartFormData } from "../formData";

class CustomError extends Error {
  constructor() {
    super("test error");
  }
}

describe("parseMultipartFormData", () => {
  it("can use a custom upload handler", async () => {
    let formData = new FormData();
    formData.set("a", "value");
    formData.set("blob", new Blob(["blob".repeat(1000)]), "blob.txt");
    formData.set("file", new File(["file".repeat(1000)], "file.txt"));

    let req = new Request("https://test.com", {
      method: "post",
      body: formData,
    });

    let parsedFormData = await parseMultipartFormData(
      req,
      async ({ filename, data, contentType }) => {
        let chunks = [];
        for await (let chunk of data) {
          chunks.push(chunk);
        }
        if (filename) {
          return new File(chunks, filename, { type: contentType });
        }

        return await new Blob(chunks, { type: contentType }).text();
      }
    );

    expect(parsedFormData.get("a")).toBe("value");
    let blob = parsedFormData.get("blob") as Blob;
    expect(await blob.text()).toBe("blob".repeat(1000));
    let file = parsedFormData.get("file") as File;
    expect(file.name).toBe("file.txt");
    expect(await file.text()).toBe("file".repeat(1000));
  });

  it("can return undefined", async () => {
    let formData = new FormData();
    formData.set("a", "value");
    formData.set("blob", new Blob(["blob".repeat(1000)]), "blob.txt");
    formData.set("file", new File(["file".repeat(1000)], "file.txt"));

    let req = new Request("https://test.com", {
      method: "post",
      body: formData,
    });

    let parsedFormData = await parseMultipartFormData(
      req,
      async () => undefined
    );

    expect(parsedFormData.get("a")).toBe(null);
    expect(parsedFormData.get("blob")).toBe(null);
    expect(parsedFormData.get("file")).toBe(null);
  });

  it("can throw errors in upload handlers", async () => {
    let formData = new FormData();
    formData.set("blob", new Blob(["blob"]), "blob.txt");

    let req = new Request("https://test.com", {
      method: "post",
      body: formData,
    });

    let error: Error;
    try {
      await parseMultipartFormData(req, async () => {
        throw new CustomError();
      });
      throw new Error("should have thrown");
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(CustomError);
    expect(error.message).toBe("test error");
  });

  describe("stream should propagate events", () => {
    it("when controller errors", async () => {
      let formData = new FormData();
      formData.set("a", "value");
      formData.set("blob", new Blob(["blob".repeat(1000)]), "blob.txt");
      formData.set("file", new File(["file".repeat(1000)], "file.txt"));

      let underlyingRequest = new Request("https://test.com", {
        method: "post",
        body: formData,
      });
      let underlyingBody = await underlyingRequest.text();

      let encoder = new TextEncoder();
      let body = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(underlyingBody.slice(0, underlyingBody.length / 2))
          );
          controller.error(new CustomError());
        },
      });

      let req = new Request("https://test.com", {
        method: "post",
        body,
        headers: underlyingRequest.headers,
      });

      let error: Error;
      try {
        await parseMultipartFormData(req, async () => undefined);
        throw new Error("should have thrown");
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(CustomError);
      expect(error.message).toBe("test error");
    });

    it("when controller is closed", async () => {
      let formData = new FormData();
      formData.set("a", "value");
      formData.set("blob", new Blob(["blob".repeat(1000)]), "blob.txt");
      formData.set("file", new File(["file".repeat(1000)], "file.txt"));

      let underlyingRequest = new Request("https://test.com", {
        method: "post",
        body: formData,
      });
      let underlyingBody = await underlyingRequest.text();

      let encoder = new TextEncoder();
      let body = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode(underlyingBody.slice(0, underlyingBody.length / 2))
          );
          controller.close();
        },
      });

      let req = new Request("https://test.com", {
        method: "post",
        body,
        headers: underlyingRequest.headers,
      });

      let error: Error;
      try {
        await parseMultipartFormData(req, async () => undefined);
        throw new Error("should have thrown");
      } catch (err) {
        error = err;
      }

      expect(error).toBeInstanceOf(Error);
      expect(error.message).toMatch("malformed multipart-form data");
    });
  });
});
