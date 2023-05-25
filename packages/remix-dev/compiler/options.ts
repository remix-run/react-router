type Mode = "development" | "production" | "test";

export type Options = {
  mode: Mode;
  sourcemap: boolean;
  onWarning?: (message: string, key: string) => void;

  // TODO: required in v2
  devOrigin?: {
    scheme: string;
    host: string;
    port: number;
  };
};
