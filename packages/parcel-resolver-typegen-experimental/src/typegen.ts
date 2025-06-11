import { Resolver } from "@parcel/plugin";
import { $, type ResultPromise } from "execa";

let watchCommand: ResultPromise<{}> | undefined;

const resolver = new Resolver({
  async loadConfig({ options }) {
    if (!watchCommand && options.mode === "development") {
      watchCommand = $`react-router typegen --watch`;
      watchCommand.stdout.pipe(process.stdout);
      watchCommand.stderr.pipe(process.stderr);
      watchCommand
        .catch((reason) => {
          console.error("Error running typegen", reason);
        })
        .finally(() => {
          watchCommand = undefined;
        });
    }
  },
  resolve() {
    return undefined;
  },
});

export default resolver;
