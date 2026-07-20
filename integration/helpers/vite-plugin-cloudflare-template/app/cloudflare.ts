import { createContext } from "react-router";

declare global {
  interface CloudflareEnvironment extends Env {}
}

export const cloudflareContext = createContext<{
  env: CloudflareEnvironment;
  ctx: ExecutionContext;
}>();
