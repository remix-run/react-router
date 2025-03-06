export function parse(fullpath: string) {
  const result: Record<
    string,
    { type: "string" | "boolean"; isRequired: boolean }
  > = {};

  let segments = fullpath.split("/");
  segments.forEach((segment) => {
    const match = segment.match(/^\*$|^(:)?([\w-]+)(\?)?$/);
    if (!match) return segment;

    const isSplat = match[0] === "*";
    const param = isSplat ? "*" : match[2];
    const isDynamic = isSplat ? true : match[1] === ":";
    const isOptional = isSplat ? false : match[3] === "?";

    if (isDynamic) {
      result[param] ||= { type: "string", isRequired: !isOptional };
      return;
    }

    if (!isDynamic && isOptional) {
      result[param] ||= { type: "boolean", isRequired: false };
      return;
    }
  });

  return result;
}
