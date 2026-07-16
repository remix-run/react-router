/**
 * @react-router/dev v8.2.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { _ as getVite, v as preloadVite } from "./typegen-CNpfI4aI.js";
//#region vite/build.ts
async function build(root, viteBuildOptions) {
	await preloadVite();
	let { assetsInlineLimit, clearScreen, config: configFile, emptyOutDir, force, logLevel, minify, mode, sourcemapClient, sourcemapServer } = viteBuildOptions;
	await (await getVite().createBuilder({
		root,
		mode,
		configFile,
		build: {
			assetsInlineLimit,
			emptyOutDir,
			minify
		},
		optimizeDeps: { force },
		clearScreen,
		logLevel,
		plugins: [{
			name: "react-router:cli-config",
			configEnvironment(name) {
				if (sourcemapClient && name === "client") return { build: { sourcemap: sourcemapClient } };
				if (sourcemapServer && name !== "client") return { build: { sourcemap: sourcemapServer } };
			},
			configResolved(config) {
				if (!config.plugins.find((plugin) => plugin.name === "react-router" || plugin.name === "react-router/rsc")) throw new Error("React Router Vite plugin not found in Vite config");
			}
		}]
	})).buildApp();
}
//#endregion
export { build };
