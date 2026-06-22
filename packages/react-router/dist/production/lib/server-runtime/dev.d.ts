
//#region lib/server-runtime/dev.d.ts
type DevServerHooks = {
  getCriticalCss?: (pathname: string) => Promise<string | undefined>;
  processRequestError?: (error: unknown) => void;
};
declare function setDevServerHooks(devServerHooks: DevServerHooks): void;
//#endregion
export { setDevServerHooks };