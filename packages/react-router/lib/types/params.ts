import type { Register } from "./register";
import type { Normalize } from "./utils";

type AnyRoutes = Record<
  string,
  {
    parentId?: string;
    path?: string;
    index?: boolean;
    file: string;
    params: Record<string, string | undefined>;
  }
>;
type RoutesPre = Register extends {
  routesPre: infer RegisteredRoutes extends AnyRoutes;
}
  ? RegisteredRoutes
  : AnyRoutes;

type RouteId = keyof RoutesPre;

// prettier-ignore
type GetParents<Id extends RouteId> =
  RoutesPre[Id] extends { parentId: infer P extends RouteId } ?
    [...GetParents<P>, P] :
    [];

// prettier-ignore
type _GetChildren<Id extends RouteId> = {
  [K in RouteId]: RoutesPre[K] extends { parentId : Id } ?
    RoutesPre[K] extends { index: true } ? [K] :
    RoutesPre[K] extends { path: undefined } ? [K, ...GetChildren<K>] :
    [K] | [K, ...GetChildren<K>]
  :
  []
}[RouteId]

type GetChildren<Id extends RouteId> = _GetChildren<Id> extends []
  ? []
  : Exclude<_GetChildren<Id>, []>;

type GetBranch<Id extends RouteId> = [
  ...GetParents<Id>,
  Id,
  ...(RoutesPre[Id] extends { path: undefined }
    ? GetChildren<Id>
    : _GetChildren<Id>)
];

type Branches = {
  [Id in RouteId]: GetBranch<Id>;
};

type PartialParams = {
  [Id in RouteId]: RoutesPre[Id]["params"];
};
type BranchParams<Branch extends Array<RouteId>> = Branch extends [
  infer Id extends RouteId,
  ...infer Ids extends Array<RouteId>
]
  ? PartialParams[Id] & BranchParams<Ids>
  : {};
export type Params = {
  [Id in RouteId]: Normalize<BranchParams<Branches[Id]>>;
};
