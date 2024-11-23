export type Manifest = {
  version: string;
  url?: string | undefined;
  entry: {
    module: string;
    imports: string[];
  };
  routes: {
    [routeId: string]: {
      id: string;
      parentId?: string | undefined;
      path?: string | undefined;
      index?: boolean | undefined;
      caseSensitive?: boolean | undefined;
      module: string;
      imports?: string[] | undefined;
      hasAction: boolean;
      hasLoader: boolean;
      hasClientAction: boolean;
      hasClientLoader: boolean;
      hasErrorBoundary: boolean;
    };
  };
  hmr?:
    | {
        timestamp?: number | undefined;
        runtime: string;
      }
    | undefined;
};
