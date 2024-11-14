import type { MetaDescriptor } from "../dom/ssr/routeModules";

export type MetaMatch<LoaderData> = {
  id: string;
  pathname: string;
  data: LoaderData;
  handle?: unknown;
  params: Record<string, string | undefined>;
  meta: MetaDescriptor[];
  error?: unknown;
};
