import pc from "picocolors";
import type { Formatter } from "picocolors/types";

type FormatArgs = {
  label: string;
  color: Formatter;
};

export let format =
  ({ label, color }: FormatArgs) =>
  (message: string, details: string[] = []) => {
    let lines = [];
    lines.push(
      (pc.isColorSupported ? pc.inverse(color(` ${label} `)) : `[${label}]`) +
        " " +
        message
    );
    if (details.length > 0) {
      for (let detail of details) {
        lines.push(color("┃") + " " + pc.gray(detail));
      }
      lines.push(color("┗"));
    }
    return lines.join("\n");
  };
