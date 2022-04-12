import * as colors from "../../../../colors";

export const detected = (message: string) =>
  colors.gray("🕵️  I detected " + message);

export const because = (message: string) =>
  colors.gray("   ...because " + message);
