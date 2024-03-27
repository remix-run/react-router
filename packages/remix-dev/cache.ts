import { put, get } from "cacache";

export const putJson = async (cachePath: string, key: string, data: any) =>
  put(cachePath, key, JSON.stringify(data));

export const getJson = async (cachePath: string, key: string) =>
  get(cachePath, key).then((obj) => JSON.parse(obj.data.toString("utf-8")));
