export class RemixFormData implements FormData {
  private _params: URLSearchParams;

  constructor(body?: string) {
    this._params = new URLSearchParams(body);
  }
  append(name: string, value: string | Blob, fileName?: string): void {
    if (typeof value !== "string") {
      throw new Error("formData.append can only accept a string");
    }
    this._params.append(name, value);
  }
  delete(name: string): void {
    this._params.delete(name);
  }
  get(name: string): FormDataEntryValue | null {
    return this._params.get(name);
  }
  getAll(name: string): FormDataEntryValue[] {
    return this._params.getAll(name);
  }
  has(name: string): boolean {
    return this._params.has(name);
  }
  set(name: string, value: string | Blob, fileName?: string): void {
    if (typeof value !== "string") {
      throw new Error("formData.set can only accept a string");
    }
    this._params.set(name, value);
  }
  forEach(
    callbackfn: (
      value: FormDataEntryValue,
      key: string,
      parent: FormData
    ) => void,
    thisArg?: any
  ): void {
    this._params.forEach(callbackfn, thisArg);
  }
  entries(): IterableIterator<[string, FormDataEntryValue]> {
    return this._params.entries();
  }
  keys(): IterableIterator<string> {
    return this._params.keys();
  }
  values(): IterableIterator<FormDataEntryValue> {
    return this._params.values();
  }
  *[Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]> {
    yield* this._params;
  }
}
