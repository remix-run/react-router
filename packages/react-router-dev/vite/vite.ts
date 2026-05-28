import * as vite from "vite";

type OxcCompilerOptions = {
  jsx: {
    runtime: "automatic";
    development: boolean;
  };
};

type RolldownJsxOptions = "react-jsx";

type OptimizeDepsESBuildOptions = NonNullable<
  vite.DepOptimizationConfig["esbuildOptions"]
>;

export function defineCompilerOptions(options: {
  oxc: OxcCompilerOptions;
  esbuild: vite.ESBuildOptions;
}): { oxc: OxcCompilerOptions } | { esbuild: vite.ESBuildOptions } {
  return parseInt(vite.version.split(".")[0], 10) >= 8
    ? { oxc: options.oxc }
    : { esbuild: options.esbuild };
}

export function defineOptimizeDepsCompilerOptions(options: {
  rolldown: {
    transform: {
      jsx: RolldownJsxOptions;
    };
  };
  esbuild: OptimizeDepsESBuildOptions;
}):
  | { rolldownOptions: { transform: { jsx: RolldownJsxOptions } } }
  | { esbuildOptions: OptimizeDepsESBuildOptions } {
  return parseInt(vite.version.split(".")[0], 10) >= 8
    ? { rolldownOptions: options.rolldown }
    : { esbuildOptions: options.esbuild };
}
