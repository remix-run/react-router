export const remixSetup = /\s*remix\s+setup\s*/;
export const remixSetupRuntime = /\s*remix\s+setup\s+(\w+)\s*/;
export const onlyRemixSetup = new RegExp(`^${remixSetup.source}$`);
export const onlyRemixSetupRuntime = new RegExp(
  `^${remixSetupRuntime.source}$`
);
