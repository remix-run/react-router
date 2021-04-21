import { promises as fsp } from "fs";
import type { Plugin } from "rollup";
import chokidar from "chokidar";
import tmp from "tmp";

/**
 * Triggers a rebuild whenever anything in the given `dir` changes, including
 * adding new files.
 */
export default function watchDirectoryPlugin({ dir }: { dir: string }): Plugin {
  let tmpfile = tmp.fileSync();
  let startedWatcher = false;

  function startWatcher() {
    return new Promise((accept, reject) => {
      chokidar
        .watch(dir, {
          ignoreInitial: true,
          ignored: /node_modules/,
          followSymlinks: false
        })
        .on("add", triggerRebuild)
        .on("ready", accept)
        .on("error", reject);
    });
  }

  async function triggerRebuild() {
    let now = new Date();
    await fsp.utimes(tmpfile.name, now, now);
  }

  return {
    name: "watchDirectory",

    async buildStart() {
      // We have to use our own watcher because `this.addWatchFile` does not
      // listen for the `add` event, and we want to know when new files show up
      // in the `app` directory.
      // See https://github.com/rollup/rollup/issues/3704
      if (!startedWatcher) {
        await startWatcher();
        startedWatcher = true;
      }

      this.addWatchFile(tmpfile.name);
    }
  };
}
