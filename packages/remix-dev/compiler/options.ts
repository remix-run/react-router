type Mode = "development" | "production" | "test";

export type Options = {
  mode: Mode;
  sourcemap: boolean;

  REMIX_DEV_ORIGIN?: URL; // TODO: required in v2
};
