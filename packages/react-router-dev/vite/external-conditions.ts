// Vite exposes `defaultServerConditions`, but currently does not expose
// an equivalent set of default external conditions. Historically we hardcoded
// `node` here, but that breaks worker-like SSR environments by forcing
// resolution toward node-specific exports.
//
// See: https://github.com/remix-run/react-router/issues/14730
export function getDefaultExternalConditions(): string[] {
  return [];
}
