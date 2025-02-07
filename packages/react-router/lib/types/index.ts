import type { CreateActionData, CreateLoaderData } from "./route-module";

export interface Register {}

type AnyRoutes = Record<
  string,
  {
    parentId: string | undefined;
    path: string | undefined;
    module: Record<string, unknown>;
  }
>;

type UserRoutes = Register extends {
  routes: infer TRoutes extends AnyRoutes;
}
  ? TRoutes
  : AnyRoutes;
type RouteId = keyof UserRoutes;

type Data = {
  [Id in RouteId]: {
    loaderData: CreateLoaderData<UserRoutes[Id]["module"]>;
    actionData: CreateActionData<UserRoutes[Id]["module"]>;
  };
};

export type Routes = {
  [Id in RouteId]: {
    module: UserRoutes[Id]["module"];
    loaderData: Data[Id]["loaderData"];
    actionData: Data[Id]["actionData"];
  };
};
