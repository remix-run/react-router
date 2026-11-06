import type { Location } from "../router/history";
import type {
  ElementScrollPositions,
  ElementScrollRestorationSnapshot,
  Router,
} from "../router/router";
import type { UIMatch } from "../router/utils";

export const ELEMENT_SCROLL_STORAGE_SUFFIX = ":elements";

type Positions = Record<string, ElementScrollPositions>;
type Commit = {
  location: Location;
  identity: Location;
  matches: UIMatch[];
  positions?: ElementScrollRestorationSnapshot | false;
  preventScrollReset: boolean;
};
type Configuration = {
  storageKey: string;
  getKey(location: Location, matches: UIMatch[]): string;
};
export type ElementScrollRegistration = {
  commit?: Commit;
  configuration?: Configuration;
  attempted?: { location: Location; selector: string; element: Element | null };
};
type Receipt = {
  storageKey: string;
  key: string;
  locationKey: string;
  selector: string;
  element: Element;
};

declare global {
  interface Window {
    __reactRouterElementScrollRestoration?: Receipt[];
  }
}

let managers = new WeakMap<Router, ElementScrollManager>();

export function getElementScrollManager(router: Router) {
  let manager = managers.get(router);
  if (!manager) {
    manager = new ElementScrollManager(router);
    managers.set(router, manager);
  }
  return manager;
}

function findElement(selector: string): Element | null {
  try {
    return document.querySelector(selector);
  } catch {
    return null;
  }
}

function readPositions(storageKey: string): Positions {
  let positions: Positions = Object.create(null);
  try {
    let stored = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (stored?.version !== 1 || typeof stored.positions !== "object") {
      return positions;
    }
    for (let [key, entry] of Object.entries(stored.positions || {})) {
      if (!entry || typeof entry !== "object") continue;
      let targets: ElementScrollPositions = Object.create(null);
      for (let [selector, position] of Object.entries(entry)) {
        if (
          position &&
          typeof position === "object" &&
          "x" in position &&
          "y" in position &&
          typeof position.x === "number" &&
          typeof position.y === "number" &&
          Number.isFinite(position.x) &&
          Number.isFinite(position.y)
        ) {
          targets[selector] = { x: position.x, y: position.y };
        }
      }
      positions[key] = targets;
    }
  } catch {
    // In-memory navigation restoration still works when storage is unavailable.
  }
  return positions;
}

class ElementScrollManager {
  private registrations = new Map<ElementScrollRegistration, string>();
  private roots = new Map<object, Configuration>();
  private caches = new Map<string, Positions>();
  private pending = false;
  private disable?: () => void;

  constructor(private router: Router) {}

  private configuration(): Configuration {
    return (
      Array.from(this.roots.values()).at(-1) || {
        storageKey: "react-router-scroll-positions",
        getKey: (location) => location.key,
      }
    );
  }

  private cache(storageKey = this.configuration().storageKey) {
    storageKey += ELEMENT_SCROLL_STORAGE_SUFFIX;
    let positions = this.caches.get(storageKey);
    if (!positions) {
      positions = readPositions(storageKey);
      this.caches.set(storageKey, positions);
    }
    return positions;
  }

  configure(token: object, configuration: Configuration) {
    this.roots.set(token, configuration);
    this.schedule();
    return () => {
      this.roots.delete(token);
    };
  }

  register(token: ElementScrollRegistration, selector: string) {
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
            positions: this.cache()[key] || Object.create(null),
          };
        },
        dispose: () => this.dispose(),
      });
      window.addEventListener("pagehide", this.pagehide);
    }
    this.schedule();
    return () => {
      // Keep the actual departing node: querySelector may already find its
      // replacement, or nothing, during React's layout-effect cleanup.
      this.capture(
        token,
        selector,
        token.attempted?.element,
        token.configuration,
      );
      this.registrations.delete(token);
      if (this.registrations.size === 0) {
        this.persist();
        this.disable?.();
        this.disable = undefined;
        window.removeEventListener("pagehide", this.pagehide);
      }
    };
  }

  update(token: ElementScrollRegistration, commit: Commit) {
    token.commit = commit;
    this.schedule();
  }

  private schedule() {
    if (!this.pending) {
      this.pending = true;
      // Wait for sibling layout effects, including a root ScrollRestoration
      // rendered after the containers. This is one commit pass, not a retry.
      queueMicrotask(() => {
        this.pending = false;
        this.restore();
      });
    }
  }

  private capture(
    token: ElementScrollRegistration,
    selector: string,
    element?: Element | null,
    configuration = this.configuration(),
  ) {
    if (!token.commit || !element?.isConnected) return;
    let { location, matches } = token.commit;
    let key = configuration.getKey(location, matches);
    let positions = this.cache(configuration.storageKey);
    let entry = positions[key] || (positions[key] = Object.create(null));
    entry[selector] = { x: element.scrollLeft, y: element.scrollTop };
  }

  private save() {
    let receipts = window.__reactRouterElementScrollRestoration;
    if (receipts) {
      let namespace =
        this.configuration().storageKey + ELEMENT_SCROLL_STORAGE_SUFFIX;
      receipts = receipts.filter((receipt) => receipt.storageKey !== namespace);
      if (receipts.length)
        window.__reactRouterElementScrollRestoration = receipts;
      else delete window.__reactRouterElementScrollRestoration;
    }
    // Different Suspense boundaries can retain different committed locations.
    // Measure each container against the location its own hook has committed.
    for (let [token, selector] of this.registrations) {
      this.capture(token, selector, findElement(selector));
    }
  }

  private persist() {
    for (let [storageKey, positions] of this.caches) {
      try {
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ version: 1, positions }),
        );
      } catch {
        // Storage is optional; keep the in-memory positions.
      }
    }
  }

  private pagehide = () => {
    if (this.router.state.navigation.state === "idle") this.save();
    this.persist();
  };

  private dispose() {
    window.removeEventListener("pagehide", this.pagehide);
    this.registrations.clear();
    this.disable = undefined;
  }

  private restore() {
    let targets = new Map<
      Element,
      {
        position?: { x: number; y: number };
        hashTarget: Element | null;
        preventScrollReset: boolean;
      }
    >();
    let receipts = window.__reactRouterElementScrollRestoration;
    if (receipts) {
      receipts = receipts.filter((receipt) => receipt.element.isConnected);
      if (receipts.length)
        window.__reactRouterElementScrollRestoration = receipts;
      else delete window.__reactRouterElementScrollRestoration;
    }
    for (let [token, selector] of this.registrations) {
      if (!token.commit) continue;
      token.configuration = this.configuration();
      let { location, identity, matches, positions, preventScrollReset } =
        token.commit;
      if (
        token.attempted?.location === identity &&
        token.attempted.selector === selector
      )
        continue;
      let element = findElement(selector);
      let duplicate =
        element &&
        Array.from(this.registrations.keys()).some(
          (other) =>
            other !== token &&
            other.attempted?.location === identity &&
            other.attempted.selector === selector &&
            other.attempted.element === element,
        );
      token.attempted = { location: identity, selector, element };
      if (!element || positions === false || duplicate) continue;
      let { storageKey, getKey } = token.configuration;
      let key = getKey(location, matches);
      let snapshot =
        positions?.storageKey === storageKey && positions.key === key
          ? positions.positions
          : undefined;
      let saved =
        snapshot && Object.hasOwn(snapshot, selector)
          ? snapshot
          : this.cache()[key];
      let receipts = window.__reactRouterElementScrollRestoration;
      let receipt = receipts?.findIndex(
        (r) =>
          r.storageKey === storageKey + ELEMENT_SCROLL_STORAGE_SUFFIX &&
          r.key === key &&
          r.locationKey === location.key &&
          r.selector === selector &&
          r.element === element,
      );
      if (receipt != null && receipt >= 0) {
        receipts!.splice(receipt, 1);
        if (receipts!.length === 0)
          delete window.__reactRouterElementScrollRestoration;
        continue;
      }
      let hashTarget: Element | null = null;
      try {
        hashTarget = location.hash
          ? document.getElementById(decodeURIComponent(location.hash.slice(1)))
          : null;
      } catch {
        // Malformed fragment identifiers do not prevent other restorations.
      }
      targets.set(element, {
        position:
          saved && Object.hasOwn(saved, selector) ? saved[selector] : undefined,
        hashTarget,
        preventScrollReset,
      });
    }
    // Restore inner elements first so outer hash geometry uses their final layout.
    let elements = Array.from(targets.keys()).sort((a, b) =>
      a.contains(b) ? 1 : b.contains(a) ? -1 : 0,
    );
    for (let element of elements) {
      let { position, hashTarget, preventScrollReset } = targets.get(element)!;
      if (position) {
        element.scrollLeft = position.x;
        element.scrollTop = position.y;
      } else if (hashTarget && element.contains(hashTarget)) {
        let targetRect = hashTarget.getBoundingClientRect();
        let rect = element.getBoundingClientRect();
        // scrollIntoView would also move window and saved scroll ancestors.
        element.scrollTop += targetRect.top - rect.top - element.clientTop;
        element.scrollLeft += targetRect.left - rect.left - element.clientLeft;
      } else if (!preventScrollReset) {
        element.scrollLeft = 0;
        element.scrollTop = 0;
      }
    }
  }
}
