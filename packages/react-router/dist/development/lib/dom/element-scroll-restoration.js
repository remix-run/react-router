/**
 * react-router v8.5.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/dom/element-scroll-restoration.ts
const ELEMENT_SCROLL_STORAGE_SUFFIX = ":elements";
let managers = /* @__PURE__ */ new WeakMap();
function getElementScrollManager(router) {
	let manager = managers.get(router);
	if (!manager) {
		manager = new ElementScrollManager(router);
		managers.set(router, manager);
	}
	return manager;
}
function findElement(selector) {
	try {
		return document.querySelector(selector);
	} catch {
		return null;
	}
}
function readPositions(storageKey) {
	let positions = Object.create(null);
	try {
		let stored = JSON.parse(sessionStorage.getItem(storageKey) || "null");
		if (stored?.version !== 1 || typeof stored.positions !== "object") return positions;
		for (let [key, entry] of Object.entries(stored.positions || {})) {
			if (!entry || typeof entry !== "object") continue;
			let targets = Object.create(null);
			for (let [selector, position] of Object.entries(entry)) if (position && typeof position === "object" && "x" in position && "y" in position && typeof position.x === "number" && typeof position.y === "number" && Number.isFinite(position.x) && Number.isFinite(position.y)) targets[selector] = {
				x: position.x,
				y: position.y
			};
			positions[key] = targets;
		}
	} catch {}
	return positions;
}
var ElementScrollManager = class {
	router;
	registrations = /* @__PURE__ */ new Map();
	roots = /* @__PURE__ */ new Map();
	caches = /* @__PURE__ */ new Map();
	pending = false;
	disable;
	constructor(router) {
		this.router = router;
	}
	configuration() {
		return Array.from(this.roots.values()).at(-1) || {
			storageKey: "react-router-scroll-positions",
			getKey: (location) => location.key
		};
	}
	cache(storageKey = this.configuration().storageKey) {
		storageKey += ELEMENT_SCROLL_STORAGE_SUFFIX;
		let positions = this.caches.get(storageKey);
		if (!positions) {
			positions = readPositions(storageKey);
			this.caches.set(storageKey, positions);
		}
		return positions;
	}
	configure(token, configuration) {
		this.roots.set(token, configuration);
		this.schedule();
		return () => {
			this.roots.delete(token);
		};
	}
	register(token, selector) {
		this.registrations.set(token, selector);
		if (!this.disable) {
			this.disable = this.router.enableElementScrollRestoration({
				save: () => this.save(),
				restore: (location, matches) => {
					let { storageKey, getKey } = this.configuration();
					let key = getKey(location, matches);
					return {
						storageKey,
						key,
						positions: this.cache()[key] || Object.create(null)
					};
				},
				dispose: () => this.dispose()
			});
			window.addEventListener("pagehide", this.pagehide);
		}
		this.schedule();
		return () => {
			this.capture(token, selector, token.attempted?.element, token.configuration);
			this.registrations.delete(token);
			if (this.registrations.size === 0) {
				this.persist();
				this.disable?.();
				this.disable = void 0;
				window.removeEventListener("pagehide", this.pagehide);
			}
		};
	}
	update(token, commit) {
		token.commit = commit;
		this.schedule();
	}
	schedule() {
		if (!this.pending) {
			this.pending = true;
			queueMicrotask(() => {
				this.pending = false;
				this.restore();
			});
		}
	}
	capture(token, selector, element, configuration = this.configuration()) {
		if (!token.commit || !element?.isConnected) return;
		let { location, matches } = token.commit;
		let key = configuration.getKey(location, matches);
		let positions = this.cache(configuration.storageKey);
		let entry = positions[key] || (positions[key] = Object.create(null));
		entry[selector] = {
			x: element.scrollLeft,
			y: element.scrollTop
		};
	}
	save() {
		let receipts = window.__reactRouterElementScrollRestoration;
		if (receipts) {
			let namespace = this.configuration().storageKey + ELEMENT_SCROLL_STORAGE_SUFFIX;
			receipts = receipts.filter((receipt) => receipt.storageKey !== namespace);
			if (receipts.length) window.__reactRouterElementScrollRestoration = receipts;
			else delete window.__reactRouterElementScrollRestoration;
		}
		for (let [token, selector] of this.registrations) this.capture(token, selector, findElement(selector));
	}
	persist() {
		for (let [storageKey, positions] of this.caches) try {
			sessionStorage.setItem(storageKey, JSON.stringify({
				version: 1,
				positions
			}));
		} catch {}
	}
	pagehide = () => {
		if (this.router.state.navigation.state === "idle") this.save();
		this.persist();
	};
	dispose() {
		window.removeEventListener("pagehide", this.pagehide);
		this.registrations.clear();
		this.disable = void 0;
	}
	restore() {
		let targets = /* @__PURE__ */ new Map();
		let receipts = window.__reactRouterElementScrollRestoration;
		if (receipts) {
			receipts = receipts.filter((receipt) => receipt.element.isConnected);
			if (receipts.length) window.__reactRouterElementScrollRestoration = receipts;
			else delete window.__reactRouterElementScrollRestoration;
		}
		for (let [token, selector] of this.registrations) {
			if (!token.commit) continue;
			token.configuration = this.configuration();
			let { location, identity, matches, positions, preventScrollReset } = token.commit;
			if (token.attempted?.location === identity && token.attempted.selector === selector) continue;
			let element = findElement(selector);
			let duplicate = element && Array.from(this.registrations.keys()).some((other) => other !== token && other.attempted?.location === identity && other.attempted.selector === selector && other.attempted.element === element);
			token.attempted = {
				location: identity,
				selector,
				element
			};
			if (!element || positions === false || duplicate) continue;
			let { storageKey, getKey } = token.configuration;
			let key = getKey(location, matches);
			let snapshot = positions?.storageKey === storageKey && positions.key === key ? positions.positions : void 0;
			let saved = snapshot && Object.hasOwn(snapshot, selector) ? snapshot : this.cache()[key];
			let receipts = window.__reactRouterElementScrollRestoration;
			let receipt = receipts?.findIndex((r) => r.storageKey === storageKey + ":elements" && r.key === key && r.locationKey === location.key && r.selector === selector && r.element === element);
			if (receipt != null && receipt >= 0) {
				receipts.splice(receipt, 1);
				if (receipts.length === 0) delete window.__reactRouterElementScrollRestoration;
				continue;
			}
			let hashTarget = null;
			try {
				hashTarget = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
			} catch {}
			targets.set(element, {
				position: saved && Object.hasOwn(saved, selector) ? saved[selector] : void 0,
				hashTarget,
				preventScrollReset
			});
		}
		let elements = Array.from(targets.keys()).sort((a, b) => a.contains(b) ? 1 : b.contains(a) ? -1 : 0);
		for (let element of elements) {
			let { position, hashTarget, preventScrollReset } = targets.get(element);
			if (position) {
				element.scrollLeft = position.x;
				element.scrollTop = position.y;
			} else if (hashTarget && element.contains(hashTarget)) {
				let targetRect = hashTarget.getBoundingClientRect();
				let rect = element.getBoundingClientRect();
				element.scrollTop += targetRect.top - rect.top - element.clientTop;
				element.scrollLeft += targetRect.left - rect.left - element.clientLeft;
			} else if (!preventScrollReset) {
				element.scrollLeft = 0;
				element.scrollTop = 0;
			}
		}
	}
};
//#endregion
export { ELEMENT_SCROLL_STORAGE_SUFFIX, getElementScrollManager };
