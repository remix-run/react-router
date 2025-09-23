import { matchRoutes, type DataRouteObject } from "react-router";

export function getPattern(routes: DataRouteObject[], path: string) {
  let matches = matchRoutes(routes, path);
  if (matches && matches.length > 0) {
    return matches
      ?.map((m) => m.route.path)
      .filter(Boolean)
      .join("/")
      .replace(/\/\/+/g, "/");
  }
  return "unknown-pattern";
}

export function startMeasure(label: string[]) {
  let strLabel = label.join("--");
  let now = Date.now().toString();
  let start = `start:${strLabel}:${now}`;
  console.log(new Date().toISOString(), "start", strLabel);
  start += `start:${strLabel}:${now}`;
  performance.mark(start);
  return () => {
    let end = `end:${strLabel}:${now}`;
    console.log(new Date().toISOString(), "end", strLabel);
    performance.mark(end);
    performance.measure(strLabel, start, end);
  };
}

export async function measure<T>(
  label: string[],
  cb: () => Promise<T>,
): Promise<T> {
  let end = startMeasure(label);
  try {
    return await cb();
  } finally {
    end();
  }
}
