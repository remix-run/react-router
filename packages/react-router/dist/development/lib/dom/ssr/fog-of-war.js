/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { createPath } from "../../router/history.js";
import { joinPaths, matchRoutesImpl } from "../../router/utils.js";
import { createClientRoutes } from "./routes.js";
import * as React$1 from "react";
//#region lib/dom/ssr/fog-of-war.ts
const nextPaths = /* @__PURE__ */ new Set();
const discoveredPathsMaxSize = 1e3;
const discoveredPaths = /* @__PURE__ */ new Set();
const URL_LIMIT = 7680;
function getPathsWithAncestors(paths) {
	let result = /* @__PURE__ */ new Set();
	paths.forEach((path) => {
		if (!path.startsWith("/")) path = `/${path}`;
		for (let i = 1; i < path.length; i++) if (path[i] === "/") result.add(path.slice(0, i));
		result.add(path);
	});
	return Array.from(result);
}
function isFogOfWarEnabled(routeDiscovery, ssr) {
	return routeDiscovery.mode === "lazy" && ssr === true;
}
function getPartialManifest({ sri, ...manifest }, router) {
	let routeIds = new Set(router.state.matches.map((m) => m.route.id));
	let segments = router.state.location.pathname.split("/").filter(Boolean);
	let paths = ["/"];
	segments.pop();
	while (segments.length > 0) {
		paths.push(`/${segments.join("/")}`);
		segments.pop();
	}
	paths.forEach((path) => {
		let matches = matchRoutesImpl(router.routes, path, router.basename || "/", false, router.branches);
		if (matches) matches.forEach((m) => routeIds.add(m.route.id));
	});
	let initialRoutes = [...routeIds].reduce((acc, id) => Object.assign(acc, { [id]: manifest.routes[id] }), {});
	return {
		...manifest,
		routes: initialRoutes,
		sri: sri ? true : void 0
	};
}
function getPatchRoutesOnNavigationFunction(getRouter, manifest, routeModules, ssr, routeDiscovery, isSpaMode, basename) {
	if (!isFogOfWarEnabled(routeDiscovery, ssr)) return;
	return async ({ path, patch, signal, fetcherKey }) => {
		if (discoveredPaths.has(path)) return;
		let { state } = getRouter();
		await fetchAndApplyManifestPatches([path], fetcherKey ? window.location.href : createPath(state.navigation.location || state.location), manifest, routeModules, ssr, isSpaMode, basename, routeDiscovery.manifestPath, patch, signal);
	};
}
function useFogOFWarDiscovery(router, manifest, routeModules, ssr, routeDiscovery, isSpaMode) {
	React$1.useEffect(() => {
		if (!isFogOfWarEnabled(routeDiscovery, ssr) || window.navigator?.connection?.saveData === true) return;
		function registerElement(el) {
			let path = el.tagName === "FORM" ? el.getAttribute("action") : el.getAttribute("href");
			if (!path) return;
			let pathname = el.tagName === "A" ? el.pathname : new URL(path, window.location.origin).pathname;
			if (!discoveredPaths.has(pathname)) nextPaths.add(pathname);
		}
		async function fetchPatches() {
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
				await fetchAndApplyManifestPatches(lazyPaths, null, manifest, routeModules, ssr, isSpaMode, router.basename, routeDiscovery.manifestPath, router.patchRoutes);
			} catch (e) {
				console.error("Failed to fetch manifest patches", e);
			}
		}
		let debouncedFetchPatches = debounce(fetchPatches, 100);
		fetchPatches();
		let observer = new MutationObserver(() => debouncedFetchPatches());
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
		return () => observer.disconnect();
	}, [
		ssr,
		isSpaMode,
		manifest,
		routeModules,
		router,
		routeDiscovery
	]);
}
function getManifestPath(_manifestPath, basename) {
	let manifestPath = _manifestPath || "/__manifest";
	return basename == null ? manifestPath : joinPaths([basename, manifestPath]);
}
const MANIFEST_VERSION_STORAGE_KEY = "react-router-manifest-version";
async function fetchAndApplyManifestPatches(paths, errorReloadPath, manifest, routeModules, ssr, isSpaMode, basename, manifestPath, patchRoutes, signal) {
	paths = getPathsWithAncestors(paths);
	const searchParams = new URLSearchParams();
	searchParams.set("paths", paths.sort().join(","));
	searchParams.set("version", manifest.version);
	let url = new URL(getManifestPath(manifestPath, basename), window.location.origin);
	url.search = searchParams.toString();
	if (url.toString().length > 7680) {
		nextPaths.clear();
		return;
	}
	let serverPatches;
	try {
		let res = await fetch(url, { signal });
		if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
		else if (res.status === 204 && res.headers.has("X-Remix-Reload-Document")) {
			if (!errorReloadPath) {
				console.warn("Detected a manifest version mismatch during eager route discovery. The next navigation/fetch to an undiscovered route will result in a new document navigation to sync up with the latest manifest.");
				return;
			}
			try {
				if (sessionStorage.getItem(MANIFEST_VERSION_STORAGE_KEY) === manifest.version) {
					console.error("Unable to discover routes due to manifest version mismatch.");
					return;
				}
				sessionStorage.setItem(MANIFEST_VERSION_STORAGE_KEY, manifest.version);
			} catch {}
			window.location.href = errorReloadPath;
			console.warn("Detected manifest version mismatch, reloading...");
			await new Promise(() => {});
		} else if (res.status >= 400) throw new Error(await res.text());
		try {
			sessionStorage.removeItem(MANIFEST_VERSION_STORAGE_KEY);
		} catch {}
		serverPatches = await res.json();
	} catch (e) {
		if (signal?.aborted) return;
		throw e;
	}
	let knownRoutes = new Set(Object.keys(manifest.routes));
	let patches = Object.values(serverPatches).reduce((acc, route) => {
		if (route && !knownRoutes.has(route.id)) acc[route.id] = route;
		return acc;
	}, {});
	Object.assign(manifest.routes, patches);
	paths.forEach((p) => addToFifoQueue(p, discoveredPaths));
	let parentIds = /* @__PURE__ */ new Set();
	Object.values(patches).forEach((patch) => {
		if (patch && (!patch.parentId || !patches[patch.parentId])) parentIds.add(patch.parentId);
	});
	parentIds.forEach((parentId) => patchRoutes(parentId || null, createClientRoutes(patches, routeModules, null, ssr, isSpaMode, parentId)));
}
function addToFifoQueue(path, queue) {
	if (queue.size >= discoveredPathsMaxSize) {
		let first = queue.values().next().value;
		if (first !== void 0) queue.delete(first);
	}
	queue.add(path);
}
function debounce(callback, wait) {
	let timeoutId;
	return (...args) => {
		window.clearTimeout(timeoutId);
		timeoutId = window.setTimeout(() => callback(...args), wait);
	};
}
//#endregion
export { URL_LIMIT, getManifestPath, getPartialManifest, getPatchRoutesOnNavigationFunction, getPathsWithAncestors, isFogOfWarEnabled, useFogOFWarDiscovery };
