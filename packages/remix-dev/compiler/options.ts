type Mode = "development" | "production" | "test";

export type Options = {
  mode: Mode;
  liveReloadPort?: number;
  sourcemap: boolean;
  onWarning?: (message: string, key: string) => void;
};
