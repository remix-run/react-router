---
title: shouldRevalidate
new: true
---

# `shouldRevalidate`

<details>
  <summary>Type declaration</summary>

```ts
interface ShouldRevalidateFunction {
  (args: ShouldRevalidateFunctionArgs): boolean;
}

interface ShouldRevalidateFunctionArgs {
  currentUrl: URL;
  currentParams: AgnosticDataRouteMatch["params"];
  nextUrl: URL;
  nextParams: AgnosticDataRouteMatch["params"];
  formMethod?: Submission["formMethod"];
  formAction?: Submission["formAction"];
  formEncType?: Submission["formEncType"];
  text?: Submission["text"];
  formData?: Submission["formData"];
  json?: Submission["json"];
  actionResult?: any;
  unstable_actionStatus?: number;
  defaultShouldRevalidate: boolean;
}
```

</details>

This function allows you opt-out of revalidation for a route's [loader][loader] as an optimization.

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

There are several instances where data is revalidated, keeping your UI in sync with your data automatically:

- After an [`action`][action] is called via:
  - [`<Form>`][form], [`<fetcher.Form>`][fetcher], [`useSubmit`][usesubmit], or [`fetcher.submit`][fetcher]
  - When the `future.unstable_skipActionErrorRevalidation` flag is enabled, `loaders` will not revalidate by default if the `action` returns or throws a 4xx/5xx `Response`
  - You can opt-into revalidation for these scenarios via `shouldRevalidate` and the `unstable_actionStatus` parameter
- When an explicit revalidation is triggered via [`useRevalidator`][userevalidator]
- When the [URL params][params] change for an already rendered route
- When the URL Search params change
- When navigating to the same URL as the current URL

If you define `shouldRevalidate` on a route, it will first check the function before calling the route loader for new data. If the function returns `false`, then the loader _will not_ be called and the existing data for that loader will persist on the page.

<docs-info>
Fetcher loads also revalidate, but because they load a specific URL, they don't have to worry about the URL-driven revalidation scenarios above.  Fetcher loads only revalidate by default after action submissions and explicit revalidation requests.
</docs-info>

```jsx lines=[5-9,14-15,21-22]
<Route
  path="meals-plans"
  element={<MealPlans />}
  loader={loadMealPlans}
  shouldRevalidate={({ currentUrl }) => {
    // only revalidate if the submission originates from
    // the `/meal-plans/new` route.
    return currentUrl.pathname === "/meal-plans/new";
  }}
>
  <Route
    path="new"
    element={<NewMealPlanForm />}
    // `loadMealPlans` will be revalidated after
    // this action...
    action={createMealPlan}
  />
  <Route
    path=":planId/meal"
    element={<Meal />}
    // ...but not this one because origin the URL
    // is not "/meal-plans/new"
    action={updateMeal}
  />
</Route>
```

Note that this is only for data that has already been loaded, is currently rendered, and will continue to be rendered at the new URL. Data for new routes and fetchers at the new URL will always be fetched initially.

<docs-warning>Using this API risks your UI getting out of sync with your data, use with caution!</docs-warning>

[action]: ./action
[form]: ../components/form
[fetcher]: ../hooks/use-fetcher
[usesubmit]: ../hooks/use-submit
[loader]: ./loader
[params]: ./route#dynamic-segments
[pickingarouter]: ../routers/picking-a-router
[userevalidator]: ../hooks/use-revalidator
