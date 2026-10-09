/**
 * react-router v8.4.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { createPath, invariant } from "../../router/history.js";
import { DiscoveryCancelledError, getRoutePattern, prependBasename } from "../../router/utils.js";
import { createClientRoutes } from "./routes.js";
import { getManifestPath, getPathsWithAncestors, handleClientVersionMismatch, isFogOfWarEnabled } from "./fog-of-war.js";
import { useFrameworkContext } from "./components.js";
import * as React$1 from "react";
//#region lib/dom/ssr/route-discovery.ts
const defaultRouteDiscoveryOptions = { onManifestMismatch: (event) => event.defaultBehavior() };
var RouteDiscoveryRuntime = class {
	getRouter;
	manifest;
	routeModules;
	ssr;
	config;
	isSpaMode;
	basename;
	loadManifest;
	fetchImplementation;
	serverOrigin;
	isApiOnly;
	enabled;
	discoveredPaths = /* @__PURE__ */ new Set();
	nextPaths = /* @__PURE__ */ new Set();
	state;
	ready = false;
	registrations = /* @__PURE__ */ new Set();
	defaultRegistration;
	listeners = /* @__PURE__ */ new Set();
	fullLoad;
	loadedManifest;
	mismatch;
	onError;
	constructor(getRouter, manifest, routeModules, ssr, config, isSpaMode, basename, loadManifest = async () => {
		if (this.loadedManifest) return this.loadedManifest;
		try {
			await import(
				/* @vite-ignore */
				/* webpackIgnore: true */
				manifest.url
);
			invariant(window.__reactRouterManifest, "Unable to load the client manifest");
			invariant(window.__reactRouterManifest !== manifest, "The full route manifest asset did not provide a manifest.");
			this.loadedManifest = window.__reactRouterManifest;
			return this.loadedManifest;
		} finally {
			window.__reactRouterManifest = manifest;
		}
	}, fetchImplementation = (request) => fetch(request), serverOrigin, isApiOnly = false) {
		this.getRouter = getRouter;
		this.manifest = manifest;
		this.routeModules = routeModules;
		this.ssr = ssr;
		this.config = config;
		this.isSpaMode = isSpaMode;
		this.basename = basename;
		this.loadManifest = loadManifest;
		this.fetchImplementation = fetchImplementation;
		this.serverOrigin = serverOrigin;
		this.isApiOnly = isApiOnly;
		this.enabled = isFogOfWarEnabled(config, ssr);
		this.state = this.enabled && !manifest.hmr ? "partial" : "complete";
	}
	subscribe = (listener) => {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	};
	update(state, ready = this.ready) {
		this.state = state;
		this.ready = ready;
		this.listeners.forEach((listener) => listener());
	}
	markReady = () => {
		if (!this.ready) this.update(this.state, true);
	};
	register(registration, isDefault = false) {
		if (isDefault) {
			this.defaultRegistration = registration;
			return () => {
				if (this.defaultRegistration === registration) this.defaultRegistration = void 0;
			};
		}
		this.registrations.add(registration);
		return () => {
			this.registrations.delete(registration);
		};
	}
	isComplete() {
		return this.state === "complete";
	}
	loadAllRoutes = () => {
		if (this.isComplete()) return Promise.resolve();
		if (this.fullLoad) return this.fullLoad;
		this.fullLoad = Promise.resolve().then(async () => {
			try {
				let fullManifest = await this.loadManifest();
				invariant(fullManifest.version === this.manifest.version, "The full route manifest does not match the running client version.");
				applyManifestPatches(fullManifest.routes, this.manifest, this.routeModules, this.ssr, this.isSpaMode, this.getRouter().patchRoutes, this.isApiOnly);
				this.nextPaths.clear();
				this.update("complete");
			} catch (error) {
				this.update("partial");
				throw error;
			} finally {
				this.fullLoad = void 0;
			}
		});
		this.update("loading");
		return this.fullLoad;
	};
	reportError(error) {
		if (this.onError) {
			let { location, matches } = this.getRouter().state;
			this.onError(error, {
				location,
				params: matches[0]?.params || {},
				pattern: getRoutePattern(matches)
			});
		} else console.error(error);
	}
	async dispatch(kind, source, reloadUrl) {
		let stopped = false;
		let defaultBehavior;
		let loadErrors = /* @__PURE__ */ new Set();
		let event = {
			source,
			reloadUrl,
			version: this.manifest.version,
			stopPropagation() {
				stopped = true;
			},
			loadAllRoutes: () => this.loadAllRoutes().catch((error) => {
				loadErrors.add(error);
				throw error;
			}),
			defaultBehavior: () => {
				defaultBehavior ??= Promise.resolve().then(async () => {
					if (source !== "imperative" && !this.isComplete()) await handleClientVersionMismatch(true, this.manifest.version, reloadUrl);
				});
				return defaultBehavior;
			}
		};
		let registrations = [...this.registrations].reverse().filter((registration) => registration.current[kind]);
		let defaultRegistration = this.defaultRegistration || { current: defaultRouteDiscoveryOptions };
		if (registrations.length === 0) registrations.push(defaultRegistration);
		for (let registration of registrations) {
			if (registration !== defaultRegistration && !this.registrations.has(registration)) continue;
			try {
				await registration.current[kind]?.(event);
			} catch (error) {
				if (!loadErrors.has(error)) throw error;
				this.reportError(error);
				break;
			}
			if (stopped) break;
		}
	}
	requestUrl(paths) {
		let params = new URLSearchParams();
		params.set("paths", paths.slice().sort().join(","));
		params.set("version", this.manifest.version);
		let url = new URL(getManifestPath(this.config.manifestPath, this.basename), this.serverOrigin ?? window.location.origin);
		url.search = params.toString();
		return url;
	}
	discoverRoutes = async (paths, options = {}) => {
		if (options.signal?.aborted) return { type: "aborted" };
		if (this.isComplete()) return { type: "success" };
		let pathnames = paths.map((path) => {
			invariant(path.startsWith("/") && !path.startsWith("//") && !path.includes("\\"), "discoverRoutes expects application-root paths beginning with a single '/'.");
			return prependBasename({
				pathname: new URL(path, window.location.origin).pathname,
				basename: this.basename || "/"
			});
		});
		return this.discover(pathnames, "imperative", null, options.signal);
	};
	async discover(paths, source, reloadUrl, signal, patch = this.getRouter().patchRoutes) {
		if (signal?.aborted) return { type: "aborted" };
		if (this.isComplete()) return { type: "success" };
		let pending = getPathsWithAncestors(paths.filter((path) => !this.discoveredPaths.has(path)));
		if (!pending.length) return { type: "success" };
		let batches = [];
		if (source !== "imperative") {
			if (this.requestUrl(pending).href.length > 7680) {
				this.nextPaths.clear();
				return { type: "success" };
			}
			batches.push(pending);
		} else {
			let batch = [];
			for (let path of pending) {
				if (this.discoveredPaths.has(path)) continue;
				if (this.requestUrl([path]).href.length > 7680) {
					console.warn(`Unable to discover path exceeding the manifest request URL limit: ${path}`);
					continue;
				}
				if (this.requestUrl([...batch, path]).href.length > 7680) {
					batches.push(batch);
					batch = [];
				}
				batch.push(path);
			}
			if (batch.length) batches.push(batch);
		}
		for (let batch of batches) try {
			await waitForDiscovery(this.dispatch("onBeforeDiscovery", source, reloadUrl), signal);
			if (signal?.aborted) return { type: "aborted" };
			if (this.isComplete()) return { type: "success" };
			let response;
			try {
				response = await this.fetchImplementation(new Request(this.requestUrl(batch), { signal }), { type: "manifest" });
			} catch (error) {
				if (signal?.aborted) return { type: "aborted" };
				if (this.isComplete()) return { type: "success" };
				throw error;
			}
			if (signal?.aborted) return { type: "aborted" };
			if (this.isComplete()) return { type: "success" };
			if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
			if (response.status === 204 && response.headers.has("X-Remix-Reload-Document")) {
				if (this.mismatch || [...this.registrations].some((r) => r.current.onManifestMismatch)) {
					if (!this.mismatch) this.mismatch = Promise.resolve().then(() => this.dispatch("onManifestMismatch", source, reloadUrl)).finally(() => {
						this.mismatch = void 0;
					});
					await waitForDiscovery(this.mismatch, signal);
				} else await waitForDiscovery(this.dispatch("onManifestMismatch", source, reloadUrl), signal);
				if (signal?.aborted) return { type: "aborted" };
				return { type: this.isComplete() ? "success" : "version-mismatch" };
			}
			await handleClientVersionMismatch(false, this.manifest.version, reloadUrl);
			let patches;
			try {
				patches = await response.json();
			} catch (error) {
				if (signal?.aborted) return { type: "aborted" };
				if (this.isComplete()) return { type: "success" };
				throw error;
			}
			if (signal?.aborted) return { type: "aborted" };
			if (this.isComplete()) return { type: "success" };
			applyManifestPatches(patches, this.manifest, this.routeModules, this.ssr, this.isSpaMode, patch, this.isApiOnly);
			batch.forEach((path) => {
				if (this.discoveredPaths.size >= 1e3) this.discoveredPaths.delete(this.discoveredPaths.values().next().value);
				this.discoveredPaths.add(path);
			});
		} catch (error) {
			if (signal?.aborted) return { type: "aborted" };
			throw error;
		}
		return { type: "success" };
	}
};
function waitForDiscovery(promise, signal) {
	return new Promise((resolve, reject) => {
		let abort = () => resolve();
		signal?.addEventListener("abort", abort, { once: true });
		if (signal?.aborted) abort();
		promise.then(() => resolve(), reject).finally(() => signal?.removeEventListener("abort", abort));
	});
}
function useRouteDiscoveryState(runtime) {
	let [state, setState] = React$1.useState(runtime.state);
	React$1.useLayoutEffect(() => {
		let updateState = () => {
			let nextState = runtime.state;
			React$1.startTransition(() => setState(nextState));
		};
		let unsubscribe = runtime.subscribe(updateState);
		updateState();
		return unsubscribe;
	}, [runtime]);
	return state;
}
const serverLoad = () => Promise.resolve();
const serverDiscover = async () => ({ type: "success" });
/**
* Control lazy route discovery in conventional Framework Mode with
* `future.unstable_customRouteDiscovery` enabled. Full-manifest
* loading downloads metadata, not route modules. Applications must retain their
* versioned assets and maintain compatible server contracts for running clients.
*
* ```tsx
* let { state, loadAllRoutes } = unstable_useRouteDiscovery({
*   onManifestMismatch: async (event) => {
*     await event.loadAllRoutes();
*   },
* });
* ```
*
* See the [Route Discovery guide](../../how-to/route-discovery) for selective
* discovery, handler composition, and recovery behavior.
*
* @name unstable_useRouteDiscovery
* @public
* @category Hooks
* @mode framework
* @param options Awaited discovery and version-mismatch handlers.
* @returns The client version, full-manifest loading state, and discovery operations.
*/
function useRouteDiscovery(options = {}) {
	let context = useFrameworkContext();
	invariant(context.future.unstable_customRouteDiscovery, "unstable_useRouteDiscovery requires future.unstable_customRouteDiscovery to be enabled in react-router.config.ts.");
	invariant(context.manifest.url, "unstable_useRouteDiscovery is not supported in RSC mode.");
	let runtime = context.routeDiscoveryRuntime;
	useRouteDiscoveryHandlers(runtime, options);
	let state = context.routeDiscoveryState ?? (isFogOfWarEnabled(context.routeDiscovery, context.ssr) && !context.manifest.hmr ? "partial" : "complete");
	return {
		version: context.manifest.version,
		state,
		loadAllRoutes: runtime?.loadAllRoutes || serverLoad,
		discoverRoutes: runtime?.discoverRoutes || serverDiscover
	};
}
function useRouteDiscoveryHandlers(runtime, options, isDefault = false) {
	let registration = React$1.useRef({ current: options });
	let hasHandlers = Boolean(options.onBeforeDiscovery || options.onManifestMismatch);
	React$1.useLayoutEffect(() => {
		registration.current.current = options;
	});
	React$1.useLayoutEffect(() => {
		if (hasHandlers) return runtime?.register(registration.current, isDefault);
	}, [
		runtime,
		hasHandlers,
		isDefault
	]);
}
function getCustomPatchRoutesOnNavigationFunction(getRouter, runtime) {
	if (!runtime.enabled) return;
	return async ({ path, patch, signal, fetcherKey }) => {
		let { state } = getRouter();
		if ((await runtime.discover([path], fetcherKey != null ? "fetcher" : "navigation", fetcherKey != null ? window.location.href : createPath(state.navigation.location || state.location), signal, patch)).type === "version-mismatch") throw new DiscoveryCancelledError();
	};
}
function useCustomRouteDiscovery(runtime, onError) {
	useRouteDiscoveryHandlers(runtime, defaultRouteDiscoveryOptions, true);
	React$1.useLayoutEffect(() => {
		runtime.onError = onError;
	}, [runtime, onError]);
	let state = useRouteDiscoveryState(runtime);
	React$1.useEffect(() => {
		if (!runtime.enabled || window.navigator?.connection?.saveData === true) return;
		let { discoveredPaths, nextPaths } = runtime;
		function registerElement(el) {
			let path = el.tagName === "FORM" ? el.getAttribute("action") : el.getAttribute("href");
			if (!path) return;
			let pathname = el.tagName === "A" ? el.pathname : new URL(path, window.location.origin).pathname;
			if (!discoveredPaths.has(pathname)) nextPaths.add(pathname);
		}
		let active = false;
		async function fetchPatches() {
			if (!active || runtime.state === "complete") return;
			document.querySelectorAll("a[data-discover], form[data-discover]").forEach(registerElement);
			let lazyPaths = Array.from(nextPaths.keys()).filter((path) => {
				if (discoveredPaths.has(path)) {
					nextPaths.delete(path);
					return false;
				}
				return true;
			});
			if (lazyPaths.length === 0) return;
			try {
				await runtime.discover(lazyPaths, "eager", null);
			} catch (e) {
				runtime.reportError(e);
			}
		}
		let debouncedFetchPatches = debounce(fetchPatches, 100);
		let observer = new MutationObserver(() => debouncedFetchPatches());
		function updateDiscovery() {
			let { ready, state } = runtime;
			if (!ready || state === "complete") {
				active = false;
				observer.disconnect();
			} else if (!active) {
				active = true;
				observer.observe(document.documentElement, {
					subtree: true,
					childList: true,
					attributes: true,
					attributeFilter: [
						"data-discover",
						"href",
						"action"
					]
				});
				fetchPatches();
			}
		}
		let unsubscribe = runtime.subscribe(updateDiscovery);
		updateDiscovery();
		return () => {
			active = false;
			unsubscribe();
			observer.disconnect();
		};
	}, [runtime]);
	return state;
}
function applyManifestPatches(serverPatches, manifest, routeModules, ssr, isSpaMode, patchRoutes, isApiOnly) {
	let knownRoutes = new Set(Object.keys(manifest.routes));
	let patches = Object.values(serverPatches).reduce((acc, route) => {
		if (route && !knownRoutes.has(route.id)) acc[route.id] = route;
		return acc;
	}, {});
	let parentIds = /* @__PURE__ */ new Set();
	Object.values(patches).forEach((patch) => {
		if (patch && (!patch.parentId || !patches[patch.parentId])) parentIds.add(patch.parentId);
	});
	parentIds.forEach((parentId) => patchRoutes(parentId || null, createClientRoutes(patches, routeModules, null, ssr, isSpaMode, parentId, void 0, void 0, isApiOnly)));
	Object.assign(manifest.routes, patches);
}
function debounce(callback, wait) {
	let timeoutId;
	return (...args) => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => callback(...args), wait);
	};
}
//#endregion
export { RouteDiscoveryRuntime, getCustomPatchRoutesOnNavigationFunction, useCustomRouteDiscovery, useRouteDiscovery };
