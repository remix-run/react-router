import fetch, { Request, Response, FormData } from "@web-std/fetch";

if (!globalThis.fetch) {
  globalThis.fetch = fetch;
  globalThis.Request = Request;
  // web-std/fetch Response does not currently implement Response.error()
  // @ts-expect-error
  globalThis.Response = Response;
  globalThis.FormData = FormData;

  // Temporary patch util @web-std/fetch properly supports this
  // See: https://github.com/web-std/io/pull/60
  let oldRequestFormData = globalThis.Request.prototype.formData;
  globalThis.Request.prototype.formData = async function formDataShim() {
    let contentType = this.headers?.get("Content-Type") || "";
    if (
      contentType.startsWith("application/x-www-form-urlencoded") &&
      this.body != null
    ) {
      const form = new FormData();
      let bodyText = await this.text();
      new URLSearchParams(bodyText).forEach((v, k) => form.append(k, v));
      return form;
    }
    return oldRequestFormData.call(this);
  };
}
