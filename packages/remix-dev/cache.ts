import { put, get } from "cacache";

export { put, get };

export function putJson(cachePath: string, key: string, data: any) {
  return put(cachePath, key, JSON.stringify(data));
}

export function getJson(cachePath: string, key: string) {
  return get(cachePath, key).then(obj =>
    JSON.parse(obj.data.toString("utf-8"))
  );
}
