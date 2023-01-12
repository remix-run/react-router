---
title: shouldRevalidate
new: true
---

# `shouldRevalidate`

This function allows you opt-out of revalidation for a route's loader as an optimization.

<docs-warning>This feature only works if using a data router, see [Picking a Router][pickingarouter]</docs-warning>

There are several instances where data is revalidated, keeping your UI in sync with your data automatically:

- After an [`action`][action] is called from a [`<Form>`][form].
- After an [`action`][action] is called from a [`<fetcher.Form>`][fetcher]
- After an [`action`][action] is called from [`useSubmit`][usesubmit]
- After an [`action`][action] is called from a [`fetcher.submit`][fetcher]
- When the [URL params][params] change for an already rendered route
- When the URL Search params change
- When navigating to the same URL as the current URL

If you define `shouldRevalidate` on a route, it will first check the function before calling the route loader for new data. If the function returns `false`, then the loader _will not_ be called and the existing data for that loader will persist on the page.

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

## Type Declaration

```ts
interface ShouldRevalidateFunction {
  (args: {
    currentUrl: URL;
    currentParams: AgnosticDataRouteMatch["params"];
    nextUrl: URL;
    nextParams: AgnosticDataRouteMatch["params"];
    formMethod?: Submission["formMethod"];
    formAction?: Submission["formAction"];
    formEncType?: Submission["formEncType"];
    formData?: Submission["formData"];
    actionResult?: DataResult;
    defaultShouldRevalidate: boolean;
  }): boolean;
}
```

[action]: ./action
[form]: ../components/form
[fetcher]: ../hooks/use-fetcher
[usesubmit]: ../hooks/use-submit
[loader]: ./loader
[useloaderdata]: ../hooks/use-loader-data
[params]: ./route#dynamic-segments
[pickingarouter]: ../routers/picking-a-router
