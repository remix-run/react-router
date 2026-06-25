# Plan: Remove "Agnostic" Layer from RouteObject/RouteMatch Types

**Goal**: Consolidate the framework-agnostic and React-specific type layers into a single React-aware layer without breaking the public API.

## Background

React Router historically maintained a framework-agnostic layer to support multiple UI frameworks. Since we no longer support other frameworks, we can simplify our type hierarchy by removing this abstraction.

### Current Structure

**Agnostic Layer** (`lib/router/utils.ts`):

- `AgnosticBaseRouteObject` - Base route properties (loader, action, etc.)
- `AgnosticIndexRouteObject` - Index route without children
- `AgnosticNonIndexRouteObject` - Route with optional children
- `AgnosticRouteObject` - Union of index/non-index routes
- `AgnosticDataIndexRouteObject` - Index route with required `id`
- `AgnosticDataNonIndexRouteObject` - Non-index route with required `id`
- `AgnosticDataRouteObject` - Data route with required `id`
- `AgnosticRouteMatch` - Match result
- `AgnosticDataRouteMatch` - Data route match result

**React Layer** (`lib/context.ts`):

- `IndexRouteObject` - Extends agnostic type + React fields (`element`, `Component`, `errorElement`, `ErrorBoundary`, `hydrateFallbackElement`, `HydrateFallback`)
- `NonIndexRouteObject` - Extends agnostic type + React fields
- `RouteObject` - Union of index/non-index
- `DataRouteObject` - Route with required `id`
- `RouteMatch` - Extends `AgnosticRouteMatch`
- `DataRouteMatch` - Extends `AgnosticRouteMatch`

### Problem

The two-layer structure adds complexity:

1. Duplicate type definitions with subtle differences
2. Requires understanding inheritance hierarchy
3. The "agnostic" layer no longer serves a purpose
4. React types extend agnostic types just to add React-specific fields

## Proposed Solution

**Strategy**: Consolidate types by renaming the "agnostic" types to be the primary React-aware types, eliminating the prefix entirely.

### Approach: Rename and Merge (Alternative 1)

Since `Agnostic*` types are not exported from the public API, we can safely rename them to become the primary `RouteObject`, `RouteMatch`, etc. types. The React layer in `context.ts` will re-export these types, maintaining the public API contract.

#### Step 1: Update `lib/router/utils.ts`

Rename existing `Agnostic*` types and add React-specific fields:

```typescript
/**
 * Base RouteObject with common props shared by all types of routes
 */
type BaseRouteObject = {
  caseSensitive?: boolean;
  path?: string;
  id?: string;
  middleware?: MiddlewareFunction[];
  loader?: LoaderFunction | boolean;
  action?: ActionFunction | boolean;
  hasErrorBoundary?: boolean;
  shouldRevalidate?: ShouldRevalidateFunction;
  handle?: any;
  lazy?: LazyRouteDefinition<RouteObject>;
  // React-specific fields (merged from context.ts)
  element?: React.ReactNode | null;
  hydrateFallbackElement?: React.ReactNode | null;
  errorElement?: React.ReactNode | null;
  Component?: React.ComponentType | null;
  HydrateFallback?: React.ComponentType | null;
  ErrorBoundary?: React.ComponentType | null;
};

/**
 * Index routes must not have children
 */
export type IndexRouteObject = BaseRouteObject & {
  children?: undefined;
  index: true;
};

/**
 * Non-index routes may have children, but cannot have index
 */
export type NonIndexRouteObject = BaseRouteObject & {
  children?: RouteObject[];
  index?: false;
};

/**
 * A route object represents a logical route, with (optionally) its child
 * routes organized in a tree-like structure.
 */
export type RouteObject = IndexRouteObject | NonIndexRouteObject;

export type DataIndexRouteObject = IndexRouteObject & {
  id: string;
};

export type DataNonIndexRouteObject = NonIndexRouteObject & {
  children?: DataRouteObject[];
  id: string;
};

/**
 * A data route object, which is just a RouteObject with a required unique ID
 */
export type DataRouteObject = DataIndexRouteObject | DataNonIndexRouteObject;

/**
 * A RouteMatch contains info about how a route matched a URL.
 */
export interface RouteMatch<
  ParamKey extends string = string,
  RouteObjectType extends RouteObject = RouteObject,
> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The portion of the URL pathname that was matched before child routes.
   */
  pathnameBase: string;
  /**
   * The route object that was used to match.
   */
  route: RouteObjectType;
}

export interface DataRouteMatch extends RouteMatch<string, DataRouteObject> {}
```

Key changes:

- `AgnosticBaseRouteObject` → `BaseRouteObject` (add React fields)
- `AgnosticIndexRouteObject` → `IndexRouteObject`
- `AgnosticNonIndexRouteObject` → `NonIndexRouteObject`
- `AgnosticRouteObject` → `RouteObject`
- `AgnosticDataIndexRouteObject` → `DataIndexRouteObject`
- `AgnosticDataNonIndexRouteObject` → `DataNonIndexRouteObject`
- `AgnosticDataRouteObject` → `DataRouteObject`
- `AgnosticRouteMatch` → `RouteMatch`
- `AgnosticDataRouteMatch` → `DataRouteMatch`

#### Step 2: Update `lib/context.ts`

Convert to simple re-exports since the types now exist in `utils.ts`:

```typescript
// Re-export route types from utils (they're now React-aware)
export type {
  IndexRouteObject,
  NonIndexRouteObject,
  RouteObject,
  DataRouteObject,
  RouteMatch,
  DataRouteMatch,
} from "./router/utils";

// PatchRoutesOnNavigationFunction types can now be simplified
export type PatchRoutesOnNavigationFunctionArgs =
  AgnosticPatchRoutesOnNavigationFunctionArgs<RouteObject, RouteMatch>;

export type PatchRoutesOnNavigationFunction =
  AgnosticPatchRoutesOnNavigationFunction<RouteObject, RouteMatch>;
```

Remove duplicate type definitions and re-export from `utils.ts`:

**Before:**
```typescriptimport or reference `Agnostic\*` types:

**Files to update:**

1. `lib/router/router.ts` - Update all `AgnosticDataRouteObject` → `DataRouteObject`, `AgnosticDataRouteMatch` → `DataRouteMatch`, `AgnosticRouteObject` → `RouteObject`
2. `lib/router/instrumentation.ts` - Update route type references
3. `lib/router/utils.ts` - Update internal function signatures, type parameters, and helper functions
4. `lib/dom/ssr/links.ts` - Update `AgnosticDataRouteMatch` → `DataRouteMatch`
5. `lib/rsc/server.rsc.ts` - Update `AgnosticDataRouteMatch` → `DataRouteMatch`
6. `lib/context.ts` - Update `AgnosticPatchRoutesOnNavigationFunctionArgs` references (or rename those too)
7. `__tests__/**/*.ts` - Update test type references (~40 files)

**Note**: Some files may still reference `Agnostic*` types that are part of function/generic names (like `AgnosticPatchRoutesOnNavigationFunction`). These can be renamed in a follow-up or kept as-is if the name makes sense in context.

````

**After:**
```typescript
// Re-export route types from utils (they're now React-aware)
export type {
  IndexRouteObject,
  NonIndexRouteObject,
  RouteObject,
  DataRouteObject,
  RouteMatch,
  DataRouteMatch,
} from "./router/utils";

// PatchRoutesOnNavigationFunction types remain the same
export type PatchRoutesOnNavigationFunctionArgs =
  AgnosticPatchRoutesOnNavigationFunctionArgs<RouteObject, RouteMatch>;

export type PatchRoutesOnNavigationFunction =
  AgnosticPatchRoutesOnNavigationFunction<RouteObject, RouteMatch>;
````

This eliminates ~70 lines of duplicate type definitions.ction matchRoutes<
RouteObjectType extends AgnosticRouteObject = AgnosticRouteObject

> (...)

// After
function matchRoutes<
RouteObjectType extends RouteObject = RouteObject

> (...)

````

#### Step 5: Update Helper Functions

Update type guards and helper functions:

```typescript
// Before
function isIndexRoute(
  route: AgnosticRouteObject,
): route is AgnosticIndexRouteObject

// After
function isIndexRoute(
  route: RouteObject,
): route is IndexRouteObject
````

**No migration needed!**

Since `Agnostic*` types are not part of the public API (not exported from `index.ts`), this is purely an internal refactoring. External consumers only use `RouteObject`, `DataRouteObject`, `RouteMatch`, and `DataRouteMatch` which remain unchanged in the public API.`RouteMatch`, `DataRouteMatch`) still exported

**Internal API**: ⚠️ Requires updates

- Functions using `Agnostic*` types need updating
- Tests using `Agnostic*` types need updating
- Backward compatibility aliases prevent hard breaks

**Type Safety**: ✅ Maintained

- All types remain strongly typed
- React-specific fields properly typed throughout
- No loss of type information

### Migration Path for Consumers

For any external code using the `Agnostic*` types (unlikely since they're not exported):

1. **Short term**: Backward compatibility aliases work transparently
2. **Medium term**: Types marked `@internal` and `@deprecated`
3. **Long term**: Remove aliases in next major version

### Testing Strategy

1. **Type checks**: Ensure `pnpm typecheck` passes
2. **Unit tests**: Ensure `pnpm test` passes
3. **Integration tests**: Ensure `pnpm test:integration --project chromium` passes
4. **Build**: Ensure `pnpm build` succeeds
5. **Docs generation**: Ensure `pnpm docs` works correctly

### Implementation Order

### Implementation Order

1. ✅ Create this plan document
2. ✅ Update `lib/router/utils.ts` - Rename `Agnostic*` types to remove prefix, add React fields to base types
3. ✅ Update `lib/context.ts` - Remove duplicate definitions, convert to re-exports
4. ✅ Update `lib/router/router.ts` - Replace all `Agnostic*` type references
5. ✅ Update `lib/router/instrumentation.ts` - Replace `Agnostic*` type references
6. ✅ Update `lib/dom/ssr/links.ts` - Replace `AgnosticDataRouteMatch` references
7. ✅ Update `lib/rsc/server.rsc.ts` - Replace `AgnosticDataRouteMatch` references
8. ✅ Update test files - Replace `Agnostic*` type references (~40 files) - No test files needed updating
9. ✅ Run full test suite (`pnpm typecheck && pnpm test && pnpm test:integration --project chromium`) - All passing
10. ✅ Update JSDoc comments if any reference "agnostic" or "framework-agnostic"
11. ✅ Create changeset

### Risks & Mitigations

Accidentally changing public API behavior

- **Mitigation**: Public exports in `index.ts` remain unchanged, only importing from same location (`./lib/context`)

**Risk**: Type inference changes in complex generic scenarios

- **Mitigation**: All type fields remain identical, just location changes. Run full typecheck suite.

**Risk**: Complex merge conflicts if done across multiple PRs

- **Mitigation**: Complete in single atomic PR

**Risk**: Missing some `Agnostic*` type references in large codebase

- **Mitigation**: TypeScript compiler will catch all references; can also use global find/replace to identify all usages first
- **Mitigation**: Thorough testing at each step, update tests incrementally

## Alternative Approaches Considered

### Alternative 1: Rename to Remove "Agnostic" Prefix

Move all types f2: In-Place Consolidation with Aliases

Keep types in their current files but merge the layers by making the "agnostic" types React-aware and converting the React layer to aliases:

- `AgnosticBaseRouteObject` stays in `utils.ts` but gains React fields
- React types in `context.ts` become aliases: `export type RouteObject = AgnosticRouteObject`
- Add `@deprecated` backward compatibility aliases

**Pros**: Gradual migration path with deprecated aliases
**Cons**: Keeps confusing "Agnostic" naming, unnecessary since types aren't exported

### Alternative 3but make React types standalone (not extending):

- Both define all fields independently
- No inheritance relationship

**Pros**: Minimal code changes
**Cons**: Doesn't reduce duplication, doesn't achieve goal

### Alternative 3: Gradual Deprecation Path

4: Gradual Deprecation Path

Add new types, deprecate old ones, remove later:

- Create `RouteObjectV2` with merged types
- Deprecate `AgnosticRouteObject` and React `RouteObject`
- Remove in next major

**Pros**: Maximum safety, clear migration path
**Cons**: Temporary duplication, longer timeline, unnecessary complexity

## Decision

**Selected Approach**: Rename and Merge (Alternative 1, now main proposal)

**Rationale**:

1. ✅ Achieves goal of removing agnostic layer completely
2. ✅ **Non-breaking** - `Agnostic*` types are not in public API
3. ✅ Cleaner - removes confusing "Agnostic" prefix entirely
4. ✅ Simpler - no deprecated aliases needed since types aren't exported
5. ✅ Single atomic change is easier to review and test
6. ✅ Types live in one logical place (`utils.ts`)
7. ✅ Reduces ~70 lines of duplicate type definitions in `context.ts`

## Follow-up Work

After this refactoring:

1. Consider if `RouteManifest<R = DataRouteObject>` generic parameter is still needed
2. Evaluate if other "agnostic" patterns exist elsewhere
3. Update internal documentation about type architecture
4. Consider removing `@internal` aliases in v8
