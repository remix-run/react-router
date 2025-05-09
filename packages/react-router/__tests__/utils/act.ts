// @ts-expect-error This utility is needed for type safety because our React types are deliberately left at v18
import { act as reactAct } from "react";

type Act =
  | ((callback: () => void) => void)
  | (<T>(callback: () => T | Promise<T>) => Promise<T>);

export const act = reactAct as Act;
