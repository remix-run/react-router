import type { CreateActionData, CreateLoaderData } from "./route-module";
import type { Pretty } from "./utils";

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

type Branches = {
  [Id in RouteId]: GetBranch<Id>;
};

type Params = {
  [Id in RouteId]: Pretty<BranchParams<Branches[Id]>>;
};

export type Routes = {
  [Id in RouteId]: {
    params: Params[Id];
    module: UserRoutes[Id]["module"];
    loaderData: Data[Id]["loaderData"];
    actionData: Data[Id]["actionData"];
  };
};

// params ------------------------------------------------------------------------------------------

type PartialParams = {
  [Id in RouteId]: UserRoutes[Id]["path"] extends string
    ? ParseParams<UserRoutes[Id]["path"]>
    : {};
};
type BranchParams<Branch extends Array<RouteId>> = Branch extends [
  infer Id extends RouteId,
  ...infer Ids extends Array<RouteId>
]
  ? PartialParams[Id] & BranchParams<Ids>
  : {};

// prettier-ignore
type Regex_az = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m" | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
// prettier-ignore
type Regez_AZ = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M" | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
type Regex_09 = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Regex_w = Regex_az | Regez_AZ | Regex_09 | "_";
type ParamChar = Regex_w | "-";

// Emulates regex `+`
type RegexMatchPlus<
  CharPattern extends string,
  T extends string
> = T extends `${infer First}${infer Rest}`
  ? First extends CharPattern
    ? RegexMatchPlus<CharPattern, Rest> extends never
      ? First
      : `${First}${RegexMatchPlus<CharPattern, Rest>}`
    : never
  : never;

// Recursive helper for finding path parameters in the absence of wildcards
type _ParseParams<Path extends string> =
  // split path into individual path segments
  Path extends `${infer L}/${infer R}`
    ? _ParseParams<L> & _ParseParams<R>
    : // find params after `:`
    Path extends `:${infer Param}`
    ? Param extends `${infer Optional}?${string}`
      ? RegexMatchPlus<ParamChar, Optional> extends infer Id extends string
        ? { [K in Id]?: string }
        : {}
      : RegexMatchPlus<ParamChar, Param> extends infer Id extends string
      ? { [K in Id]: string }
      : {}
    : // otherwise, there aren't any params present
      {};

type ParseParams<Path extends string> =
  // check if path is just a wildcard
  Path extends "*" | "/*"
    ? "*"
    : // look for wildcard at the end of the path
    Path extends `${infer Rest}/*`
    ? Pretty<_ParseParams<Rest> & { "*": string }>
    : // look for params in the absence of wildcards
      Pretty<_ParseParams<Path>>;

// utils -------------------------------------------------------------------------------------------

type GetParents<Id extends RouteId> = UserRoutes[Id] extends {
  parentId: infer P extends RouteId;
}
  ? [...GetParents<P>, P]
  : [];

type _GetChildren<Id extends RouteId> = {
  [K in RouteId]: UserRoutes[K] extends { parentId: Id }
    ? [K, ..._GetChildren<K>]
    : [];
}[RouteId];
type GetChildren<Id extends RouteId> = _GetChildren<Id> extends []
  ? []
  : Exclude<_GetChildren<Id>, []>;

type GetBranch<Id extends RouteId> = [
  ...GetParents<Id>,
  Id,
  ...GetChildren<Id>
];
