/**
 * The mode to use when running the server.
 */
export enum ServerMode {
  Development = "development",
  Production = "production",
  Test = "test"
}

export function isValidServerMode(mode: string): mode is ServerMode {
  return (
    mode === ServerMode.Development ||
    mode === ServerMode.Production ||
    mode === ServerMode.Test
  );
}
