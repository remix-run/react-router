import { randomBytes } from "node:crypto";
import { createReadStream, createWriteStream, statSync } from "node:fs";
import { rm, mkdir, stat as statAsync, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, extname, resolve as resolvePath } from "node:path";
import type { Readable } from "node:stream";
import { finished } from "node:stream";
import { promisify } from "node:util";
import { MaxPartSizeExceededError } from "@remix-run/server-runtime";
import type { UploadHandler } from "@remix-run/server-runtime";
// @ts-expect-error
import * as streamSlice from "stream-slice";

import {
  createReadableStreamFromReadable,
  readableStreamToString,
} from "../stream";

export type FileUploadHandlerFilterArgs = {
  filename: string;
  contentType: string;
  name: string;
};

export type FileUploadHandlerPathResolverArgs = {
  filename: string;
  contentType: string;
  name: string;
};

/**
 * Chooses the path of the file to be uploaded. If a string is not
 * returned the file will not be written.
 */
export type FileUploadHandlerPathResolver = (
  args: FileUploadHandlerPathResolverArgs
) => string | undefined;

export type FileUploadHandlerOptions = {
  /**
   * Avoid file conflicts by appending a count on the end of the filename
   * if it already exists on disk. Defaults to `true`.
   */
  avoidFileConflicts?: boolean;
  /**
   * The directory to write the upload.
   */
  directory?: string | FileUploadHandlerPathResolver;
  /**
   * The name of the file in the directory. Can be a relative path, the directory
   * structure will be created if it does not exist.
   */
  file?: FileUploadHandlerPathResolver;
  /**
   * The maximum upload size allowed. If the size is exceeded an error will be thrown.
   * Defaults to 3000000B (3MB).
   */
  maxPartSize?: number;
  /**
   *
   * @param filename
   * @param contentType
   * @param name
   */
  filter?(args: FileUploadHandlerFilterArgs): boolean | Promise<boolean>;
};

let defaultFilePathResolver: FileUploadHandlerPathResolver = ({ filename }) => {
  let ext = filename ? extname(filename) : "";
  return "upload_" + randomBytes(4).readUInt32LE(0) + ext;
};

async function uniqueFile(filepath: string) {
  let ext = extname(filepath);
  let uniqueFilepath = filepath;

  for (
    let i = 1;
    await statAsync(uniqueFilepath)
      .then(() => true)
      .catch(() => false);
    i++
  ) {
    uniqueFilepath =
      (ext ? filepath.slice(0, -ext.length) : filepath) +
      `-${new Date().getTime()}${ext}`;
  }

  return uniqueFilepath;
}

export function createFileUploadHandler({
  directory = tmpdir(),
  avoidFileConflicts = true,
  file = defaultFilePathResolver,
  filter,
  maxPartSize = 3000000,
}: FileUploadHandlerOptions = {}): UploadHandler {
  return async ({ name, filename, contentType, data }) => {
    if (
      !filename ||
      (filter && !(await filter({ name, filename, contentType })))
    ) {
      return undefined;
    }

    let dir =
      typeof directory === "string"
        ? directory
        : directory({ name, filename, contentType });

    if (!dir) {
      return undefined;
    }

    let filedir = resolvePath(dir);
    let path =
      typeof file === "string" ? file : file({ name, filename, contentType });

    if (!path) {
      return undefined;
    }

    let filepath = resolvePath(filedir, path);

    if (avoidFileConflicts) {
      filepath = await uniqueFile(filepath);
    }

    await mkdir(dirname(filepath), { recursive: true }).catch(() => {});

    let writeFileStream = createWriteStream(filepath);
    let size = 0;
    let deleteFile = false;
    try {
      for await (let chunk of data) {
        size += chunk.byteLength;
        if (size > maxPartSize) {
          deleteFile = true;
          throw new MaxPartSizeExceededError(name, maxPartSize);
        }
        writeFileStream.write(chunk);
      }
    } finally {
      writeFileStream.end();
      await promisify(finished)(writeFileStream);

      if (deleteFile) {
        await rm(filepath).catch(() => {});
      }
    }

    // TODO: remove this typecast once TS fixed File class regression
    //  https://github.com/microsoft/TypeScript/issues/52166
    return new NodeOnDiskFile(filepath, contentType) as unknown as File;
  };
}

// TODO: remove this `Omit` usage once TS fixed File class regression
//  https://github.com/microsoft/TypeScript/issues/52166
export class NodeOnDiskFile implements Omit<File, "constructor"> {
  name: string;
  lastModified: number = 0;
  webkitRelativePath: string = "";

  // TODO: remove this property once TS fixed File class regression
  //  https://github.com/microsoft/TypeScript/issues/52166
  prototype = File.prototype;

  constructor(
    private filepath: string,
    public type: string,
    private slicer?: { start: number; end: number }
  ) {
    this.name = basename(filepath);
  }

  get size(): number {
    let stats = statSync(this.filepath);

    if (this.slicer) {
      let slice = this.slicer.end - this.slicer.start;
      return slice < 0 ? 0 : slice > stats.size ? stats.size : slice;
    }

    return stats.size;
  }

  slice(start?: number, end?: number, type?: string): Blob {
    if (typeof start === "number" && start < 0) start = this.size + start;
    if (typeof end === "number" && end < 0) end = this.size + end;

    let startOffset = this.slicer?.start || 0;

    start = startOffset + (start || 0);
    end = startOffset + (end || this.size);
    return new NodeOnDiskFile(
      this.filepath,
      typeof type === "string" ? type : this.type,
      {
        start,
        end,
      }
      // TODO: remove this typecast once TS fixed File class regression
      //  https://github.com/microsoft/TypeScript/issues/52166
    ) as unknown as Blob;
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    let stream: Readable = createReadStream(this.filepath);
    if (this.slicer) {
      stream = stream.pipe(
        streamSlice.slice(this.slicer.start, this.slicer.end)
      );
    }

    return new Promise((resolve, reject) => {
      let buf: any[] = [];
      stream.on("data", (chunk) => buf.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(buf)));
      stream.on("error", (err) => reject(err));
    });
  }

  stream(): ReadableStream<any>;
  stream(): NodeJS.ReadableStream;
  stream(): ReadableStream<any> | NodeJS.ReadableStream {
    let stream: Readable = createReadStream(this.filepath);
    if (this.slicer) {
      stream = stream.pipe(
        streamSlice.slice(this.slicer.start, this.slicer.end)
      );
    }
    return createReadableStreamFromReadable(stream);
  }

  async text(): Promise<string> {
    return readableStreamToString(this.stream());
  }

  public get [Symbol.toStringTag]() {
    return "File";
  }

  remove(): Promise<void> {
    return unlink(this.filepath);
  }
  getFilePath(): string {
    return this.filepath;
  }
}
