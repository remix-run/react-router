/**
 * @react-router/dev v8.0.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { g as preloadVite, h as getVite } from "./typegen-DXCQyb6V.js";
import { n as start, r as stop, t as getSession } from "./cli/index.js";
import colors from "picocolors";
//#region vite/dev.ts
async function dev(root, { clearScreen, config: configFile, cors, force, host, logLevel, mode, open, port, strictPort }) {
	await preloadVite();
	let server = await getVite().createServer({
		root,
		mode,
		configFile,
		server: {
			open,
			cors,
			host,
			port,
			strictPort
		},
		optimizeDeps: { force },
		clearScreen,
		logLevel
	});
	if (!server.config.plugins.find((plugin) => plugin.name === "react-router" || plugin.name === "react-router/rsc")) {
		console.error(colors.red("React Router Vite plugin not found in Vite config"));
		process.exit(1);
	}
	await server.listen();
	server.printUrls();
	server.bindCLIShortcuts({
		print: true,
		customShortcuts: [{
			key: "p",
			description: "start/stop the profiler",
			async action(server) {
				if (getSession()) await stop(server.config.logger.info);
				else await start(() => {
					server.config.logger.info("Profiler started");
				});
			}
		}]
	});
}
//#endregion
export { dev };
