import * as fs from "node:fs";
import * as path from "node:path";

import { NodeOnDiskFile } from "../upload/fileUploadHandler";
import { readableStreamToString } from "../stream";

describe("NodeOnDiskFile", () => {
  let filepath = path.resolve(__dirname, "assets/test.txt");
  let size = fs.statSync(filepath).size;
  let contents = fs.readFileSync(filepath, "utf-8");
  let file: NodeOnDiskFile;
  beforeEach(() => {
    file = new NodeOnDiskFile(filepath, "text/plain");
  });

  it("can read file as text", async () => {
    expect(await file.text()).toBe(contents);
  });

  it("can get an arrayBuffer", async () => {
    let buffer = await file.arrayBuffer();
    expect(buffer.byteLength).toBe(size);
    expect(buffer).toEqual(Buffer.from(contents));
  });

  it("can use stream", async () => {
    expect(await readableStreamToString(file.stream() as any)).toBe(contents);
  });

  it("can slice file and change type", async () => {
    let sliced = await file.slice(1, 5, "text/rofl");
    expect(sliced.type).toBe("text/rofl");
    expect(await sliced.text()).toBe(contents.slice(1, 5));
  });

  it("can slice file and get text", async () => {
    let sliced = await file.slice(1, 5);
    expect(await sliced.text()).toBe(contents.slice(1, 5));
  });

  it("can slice file twice and get text", async () => {
    let sliced = (await file.slice(1, 5)).slice(1, 2);
    expect(await sliced.text()).toBe(contents.slice(1, 5).slice(1, 2));
  });

  it("can sice file and get an arrayBuffer", async () => {
    let sliced = await file.slice(1, 5);
    let slicedRes = contents.slice(1, 5);
    let buffer = await sliced.arrayBuffer();
    expect(buffer.byteLength).toBe(slicedRes.length);
    expect(buffer).toEqual(Buffer.from(slicedRes));
  });

  it("can slice file and use stream", async () => {
    let sliced = await file.slice(1, 5);
    let slicedRes = contents.slice(1, 5);
    expect(sliced.size).toBe(slicedRes.length);
    expect(await sliced.text()).toBe(slicedRes);
  });

  it("can slice file with negative start and no end", async () => {
    let sliced = await file.slice(-2);
    let slicedRes = contents.slice(-2);
    expect(sliced.size).toBe(slicedRes.length);
    expect(await sliced.text()).toBe(slicedRes);
  });

  it("can slice file with negative start and negative end", async () => {
    let sliced = await file.slice(-3, -1);
    let slicedRes = contents.slice(-3, -1);
    expect(sliced.size).toBe(slicedRes.length);
    expect(await sliced.text()).toBe(slicedRes);
  });

  it("can slice file with negative start and negative end twice", async () => {
    let sliced = await file.slice(-3, -1).slice(1, -1);
    let slicedRes = contents.slice(-3, -1).slice(1, -1);
    expect(sliced.size).toBe(slicedRes.length);
    expect(await sliced.text()).toBe(slicedRes);
  });

  it("can slice file with start and negative end", async () => {
    let sliced = await file.slice(1, -2);
    let slicedRes = contents.slice(1, -2);
    expect(sliced.size).toBe(slicedRes.length);
    expect(await sliced.text()).toBe(slicedRes);
  });

  it("can slice file with negaive start and end", async () => {
    let sliced = await file.slice(-3, 1);
    let slicedRes = contents.slice(-3, 1);
    expect(sliced.size).toBe(slicedRes.length);
    expect(await sliced.text()).toBe(slicedRes);
  });

  it("can slice oob", async () => {
    let sliced = await file.slice(0, 10000);
    let slicedRes = contents.slice(0, 10000);
    expect(sliced.size).toBe(slicedRes.length);
    expect(await sliced.text()).toBe(slicedRes);
  });

  it("returns the file path properly", async () => {
    expect(file.getFilePath()).toEqual(filepath);
  });

  it("removes the file properly", async () => {
    let newFilePath = `${filepath}-copy`;
    fs.copyFileSync(filepath, newFilePath);

    let copiedFile = (file = new NodeOnDiskFile(newFilePath, "text/plain"));
    expect(fs.existsSync(copiedFile.getFilePath())).toBe(true);
    await copiedFile.remove();
    expect(fs.existsSync(copiedFile.getFilePath())).toBe(false);
  });
});
