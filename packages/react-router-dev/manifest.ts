export type Manifest = {
  version: string;
  url?: string;
  entry: {
    module: string;
    imports: string[];
  };
  routes: {
    [routeId: string]: {
      id: string;
      parentId?: string;
      path?: string;
      index?: boolean;
      caseSensitive?: boolean;
      module: string;
      imports?: string[];
      hasAction: boolean;
      hasLoader: boolean;
      hasClientAction: boolean;
      hasClientLoader: boolean;
      hasErrorBoundary: boolean;
    };
  };
  hmr?: {
    timestamp?: number;
    runtime: string;
  };
};
