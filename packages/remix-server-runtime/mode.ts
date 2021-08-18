/**
 * The mode to use when running the server.
 */
export enum ServerMode {
  Development = "development",
  Production = "production",
  Test = "test"
}

export function isServerMode(value: any): value is ServerMode {
  return (
    value === ServerMode.Development ||
    value === ServerMode.Production ||
    value === ServerMode.Test
  );
}
