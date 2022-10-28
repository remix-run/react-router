import * as esbuild from "esbuild";

export type CompileFailure = Error | esbuild.BuildFailure;
export type OnCompileFailure = (failure: CompileFailure) => void;

export const logCompileFailure: OnCompileFailure = (failure) => {
  if ("warnings" in failure || "errors" in failure) {
    if (failure.warnings) {
      let messages = esbuild.formatMessagesSync(failure.warnings, {
        kind: "warning",
        color: true,
      });
      console.warn(...messages);
    }

    if (failure.errors) {
      let messages = esbuild.formatMessagesSync(failure.errors, {
        kind: "error",
        color: true,
      });
      console.error(...messages);
    }
  }

  console.error(failure?.message || "An unknown build error occurred");
};
