import type { InputOption, Plugin } from "rollup";

import type { RemixConfig } from "./remixConfig";
import { getRemixConfig } from "./remixConfig";

/**
 * Enables setting the compiler's input dynamically via a hook function.
 */
export default function remixInputsPlugin({
  getInput
}: {
  getInput: (config: RemixConfig) => InputOption;
}): Plugin {
  return {
    name: "remixInputs",

    async options(options) {
      let config = await getRemixConfig(options.plugins || []);
      return { ...options, input: getInput(config) };
    }
  };
}
