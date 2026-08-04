// Provided by the build system
declare const __DEV__: boolean;
declare const REACT_ROUTER_VERSION: string;

const detectedVersions = new Set<string>();
let didWarn = false;

function isBrowser() {
  return (
    typeof window !== "undefined" &&
    typeof window.document !== "undefined" &&
    typeof window.document.createElement !== "undefined"
  );
}

function recordVersion(version: string | undefined) {
  if (version) {
    detectedVersions.add(version);
  }
}

export function warnIfReactRouterVersionMismatch() {
  if (!__DEV__ || !isBrowser()) {
    return;
  }

  try {
    recordVersion(window.__reactRouterVersion);
    recordVersion(REACT_ROUTER_VERSION);

    if (!didWarn && detectedVersions.size > 1) {
      didWarn = true;
      let versions = Array.from(detectedVersions).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true }),
      );
      console.warn(
        `React Router detected multiple versions loaded (${versions.join(
          " and ",
        )}). ` +
          `This can cause routing failures. Make sure all react-router and ` +
          `react-router-dom packages use the same version.`,
      );
    }
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    e
  ) {
    // no-op
  }
}

export function registerReactRouterVersion() {
  if (!isBrowser()) {
    return;
  }

  warnIfReactRouterVersionMismatch();

  try {
    window.__reactRouterVersion = REACT_ROUTER_VERSION;
  } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    e
  ) {
    // no-op
  }
}
