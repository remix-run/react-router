import { type Runtime, isRuntime } from "./remix";

const remixSetup = /\s*remix\s+setup(?:$|\s+)/;
const remixSetupRuntime = /\s*remix\s+setup\s+(\w+)\s*/;
const onlyRemixSetup = new RegExp(`^${remixSetup.source}$`);
const onlyRemixSetupRuntime = new RegExp(`^${remixSetupRuntime.source}$`);

export const parseRuntime = (postinstall: string): Runtime | undefined => {
  // match `remix setup <runtime>` in `postinstall` script
  let runtimeMatch = postinstall.match(remixSetupRuntime);
  if (runtimeMatch === null) return "node";
  let runtime = runtimeMatch[1];
  if (isRuntime(runtime)) return runtime;
  console.warn(
    `️⚠️  You have \`${runtime}\` in your \`postinstall\` script, but \`${runtime}\` is not a valid Remix server runtime.`
  );
  return undefined;
};

export const hasRemixSetup = (postinstall: string) => {
  return remixSetup.test(postinstall);
};

export const isOnlyRemixSetup = (postinstall: string) =>
  onlyRemixSetup.test(postinstall) || onlyRemixSetupRuntime.test(postinstall);
