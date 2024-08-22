// TODO: Make this real
export function detectRouteChunks({ code }: { code: string }): {
  hasClientActionChunk: boolean;
  hasClientLoaderChunk: boolean;
  hasRouteChunks: boolean;
} {
  let hasClientActionChunk = code.includes(
    'export { clientAction } from "./clientAction";'
  );
  let hasClientLoaderChunk = code.includes(
    'export { clientLoader } from "./clientLoader";'
  );
  let hasRouteChunks = hasClientActionChunk || hasClientLoaderChunk;

  return {
    hasClientActionChunk,
    hasClientLoaderChunk,
    hasRouteChunks,
  };
}

// TODO: Make this real
export function getRouteChunks({ code }: { code: string }) {
  let { hasClientActionChunk, hasClientLoaderChunk } = detectRouteChunks({
    code,
  });

  return {
    main: code
      .replace('export { clientAction } from "./clientAction";', "")
      .replace('export { clientLoader } from "./clientLoader";', ""),
    clientAction: hasClientActionChunk
      ? `export { clientAction } from "./clientAction";`
      : undefined,
    clientLoader: hasClientLoaderChunk
      ? `export { clientLoader } from "./clientLoader";`
      : undefined,
  };
}
