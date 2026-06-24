type ViteModule = typeof import("vite");

type DisableViteEnvFileLoadingConfig = {
  envDir?: false;
  envFile?: false;
};

export function disableViteEnvFileLoading(
  vite: ViteModule,
): DisableViteEnvFileLoadingConfig {
  let viteMajor = Number(vite.version.split(".")[0]);
  return viteMajor >= 8 ? { envDir: false } : { envFile: false };
}
