// Borrowed from axios: https://github.com/axios/axios/blob/0e4f9fa29077ebee4499facea6be1492b42e8a26/lib/helpers/combineURLs.js#L11-L15
export function combineURLs(baseURL: string, relativeURL: string) {
  return relativeURL
    ? baseURL.replace(/\/+$/, "") + "/" + relativeURL.replace(/^\/+/, "")
    : baseURL;
}
