import * as crypto from "crypto";
import { promises as fsp } from "fs";
import * as path from "path";

import type {
  SessionStorage,
  SessionIdStorageStrategy
} from "@remix-run/server-runtime";
import { createSessionStorage } from "@remix-run/server-runtime";

interface FileSessionStorageOptions {
  /**
   * The Cookie used to store the session id on the client, or options used
   * to automatically create one.
   */
  cookie?: SessionIdStorageStrategy["cookie"];

  /**
   * The directory to use to store session files.
   */
  dir: string;
}

/**
 * Creates a SessionStorage that stores session data on a filesystem.
 *
 * The advantage of using this instead of cookie session storage is that
 * files may contain much more data than cookies.
 */
export function createFileSessionStorage({
  cookie,
  dir
}: FileSessionStorageOptions): SessionStorage {
  return createSessionStorage({
    cookie,
    async createData(data, expires) {
      let content = JSON.stringify({ data, expires });

      while (true) {
        let randomBytes = crypto.randomBytes(8);
        // This storage manages an id space of 2^64 ids, which is far greater
        // than the maximum number of files allowed on an NTFS or ext4 volume
        // (2^32). However, the larger id space should help to avoid collisions
        // with existing ids when creating new sessions, which speeds things up.
        let id = Buffer.from(randomBytes).toString("hex");

        try {
          let file = getFile(dir, id);
          await fsp.mkdir(path.dirname(file), { recursive: true });
          await fsp.writeFile(file, content, { encoding: "utf-8", flag: "wx" });
          return id;
        } catch (error) {
          if (error.code !== "EEXIST") throw error;
        }
      }
    },
    async readData(id) {
      try {
        let file = getFile(dir, id);
        let content = JSON.parse(await fsp.readFile(file, "utf-8"));
        let data = content.data;
        let expires =
          typeof content.expires === "string"
            ? new Date(content.expires)
            : null;

        if (!expires || expires > new Date()) {
          return data;
        }

        // Remove expired session data.
        if (expires) await fsp.unlink(file);

        return null;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
        return null;
      }
    },
    async updateData(id, data, expires) {
      let content = JSON.stringify({ data, expires });
      let file = getFile(dir, id);
      await fsp.mkdir(path.dirname(file), { recursive: true });
      await fsp.writeFile(file, content, "utf-8");
    },
    async deleteData(id) {
      try {
        await fsp.unlink(getFile(dir, id));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
    }
  });
}

function getFile(dir: string, id: string): string {
  // Divide the session id up into a directory (first 2 bytes) and filename
  // (remaining 6 bytes) to reduce the chance of having very large directories,
  // which should speed up file access. This is a maximum of 2^16 directories,
  // each with 2^48 files.
  return path.join(dir, id.slice(0, 4), id.slice(4));
}
