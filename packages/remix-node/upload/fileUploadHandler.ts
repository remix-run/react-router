import { randomBytes } from "crypto";
import { createReadStream, createWriteStream } from "fs";
import { rm, mkdir, readFile, stat } from "fs/promises";
import { tmpdir } from "os";
import { basename, dirname, extname, resolve as resolvePath } from "path";

import { Meter } from "./meter";
import type { UploadHandler } from "../formData";

export type FileUploadHandlerFilterArgs = {
  filename: string;
  encoding: string;
  mimetype: string;
};

export type FileUploadHandlerPathResolverArgs = {
  filename: string;
  encoding: string;
  mimetype: string;
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
  maxFileSize?: number;
  /**
   *
   * @param filename
   * @param mimetype
   * @param encoding
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
    await stat(uniqueFilepath)
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
  maxFileSize = 3000000
}: FileUploadHandlerOptions): UploadHandler {
  return async ({ name, stream, filename, encoding, mimetype }) => {
    if (filter && !(await filter({ filename, encoding, mimetype }))) {
      stream.resume();
      return;
    }

    let dir =
      typeof directory === "string"
        ? directory
        : directory({ filename, encoding, mimetype });

    if (!dir) {
      stream.resume();
      return;
    }

    let filedir = resolvePath(dir);
    let path =
      typeof file === "string" ? file : file({ filename, encoding, mimetype });

    if (!path) {
      stream.resume();
      return;
    }

    let filepath = resolvePath(filedir, path);

    if (avoidFileConflicts) {
      filepath = await uniqueFile(filepath);
    }

    await mkdir(dirname(filepath), { recursive: true }).catch(() => {});

    let meter = new Meter(name, maxFileSize);
    await new Promise<void>((resolve, reject) => {
      let writeFileStream = createWriteStream(filepath);

      let aborted = false;
      async function abort(error: Error) {
        if (aborted) return;
        aborted = true;

        stream.unpipe();
        meter.unpipe();
        stream.removeAllListeners();
        meter.removeAllListeners();
        writeFileStream.removeAllListeners();

        await rm(filepath, { force: true }).catch(() => {});

        reject(error);
      }

      stream.on("error", abort);
      meter.on("error", abort);
      writeFileStream.on("error", abort);
      writeFileStream.on("finish", resolve);

      stream.pipe(meter).pipe(writeFileStream);
    });

    return new NodeOnDiskFile(filepath, meter.bytes, mimetype);
  };
}

export class NodeOnDiskFile implements File {
  name: string;
  lastModified: number = 0;
  webkitRelativePath: string = "";

  constructor(
    private filepath: string,
    public size: number,
    public type: string
  ) {
    this.name = basename(filepath);
  }

  async arrayBuffer(): Promise<ArrayBuffer> {
    let stream = createReadStream(this.filepath);

    return new Promise((resolve, reject) => {
      const buf: any[] = [];
      stream.on("data", chunk => buf.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(buf)));
      stream.on("error", err => reject(err));
    });
  }

  slice(start?: any, end?: any, contentType?: any): Blob {
    throw new Error("Method not implemented.");
  }
  stream(): ReadableStream<any>;
  stream(): NodeJS.ReadableStream;
  stream(): ReadableStream<any> | NodeJS.ReadableStream {
    return createReadStream(this.filepath);
  }
  text(): Promise<string> {
    return readFile(this.filepath, "utf-8");
  }
}
