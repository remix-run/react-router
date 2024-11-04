import pc from "picocolors";

// https://github.com/withastro/astro/blob/2f5b28e93851f39708d0d683832c70730b40afe9/packages/astro/src/core/logger/core.ts#L53-L58
const DATE_TIME_FORMAT = new Intl.DateTimeFormat([], {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

type Level = "info" | "warn" | "error";

type Options = {
  label?: string;
  durationMs?: number;
};

const log =
  (level: Level) =>
  (body: string, options: Options = {}) => {
    const dest = level === "error" ? process.stderr : process.stdout;
    let message = getPrefix(level, options) + " " + body;
    if (options.durationMs) {
      const duration =
        options.durationMs < 1000
          ? `${Math.round(options.durationMs)}ms`
          : `${(options.durationMs / 1000).toFixed(2)}s`;
      message += " " + pc.dim(duration);
    }
    dest.write(message + "\n");
  };

function getPrefix(level: Level, options: Options) {
  const timestamp = `${DATE_TIME_FORMAT.format(new Date())}`;
  const prefix = [];
  if (level === "error" || level === "warn") {
    prefix.push(pc.bold(timestamp));
    prefix.push(`[${level.toUpperCase()}]`);
  } else {
    prefix.push(timestamp);
  }
  if (options.label) {
    prefix.push(`[${options.label}]`);
  }
  if (level === "error") return pc.red(prefix.join(" "));
  if (level === "warn") return pc.yellow(prefix.join(" "));
  if (prefix.length === 1) return pc.dim(prefix[0]);
  return pc.dim(prefix[0]) + " " + pc.blue(prefix.splice(1).join(" "));
}

export const info = log("info");
export const warn = log("warn");
export const error = log("error");
