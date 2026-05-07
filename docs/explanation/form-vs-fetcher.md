---
title: Form vs. fetcher
---

# Form vs. fetcher

[MODES: framework, data]

## Overview

Developing in React Router offers a rich set of tools that can sometimes overlap in functionality, creating a sense of ambiguity for newcomers. The key to effective development in React Router is understanding the nuances and appropriate use cases for each tool. This document seeks to provide clarity on when and why to use specific APIs.

## APIs in Focus

- [`<Form>`][form-component]
- [`useFetcher`][use-fetcher]
- [`useNavigation`][use-navigation]

Understanding the distinctions and intersections of these APIs is vital for efficient and effective React Router development.

## URL Considerations

The primary criterion when choosing among these tools is whether you want the URL to change or not:

- **URL Change Desired**: When navigating or transitioning between pages, or after certain actions like creating or deleting records. This ensures that the user's browser history accurately reflects their journey through your application.
  - **Expected Behavior**: In many cases, when users hit the back button, they should be taken to the previous page. Other times the history entry may be replaced but the URL change is important nonetheless.

- **No URL Change Desired**: For actions that don't significantly change the context or primary content of the current view. This might include updating individual fields or minor data manipulations that don't warrant a new URL or page reload. This also applies to loading data with fetchers for things like popovers, combo boxes, etc.

### When the URL Should Change

These actions typically reflect significant changes to the user's context or state:

- **Creating a New Record**: After creating a new record, it's common to redirect users to a page dedicated to that new record, where they can view or further modify it.

- **Deleting a Record**: If a user is on a page dedicated to a specific record and decides to delete it, the logical next step is to redirect them to a general page, such as a list of all records.

For these cases, developers should consider using a combination of [`<Form>`][form-component] and [`useNavigation`][use-navigation]. These tools can be coordinated to handle form submission, invoke specific actions, retrieve action-related data through component props, and manage navigation respectively.

### When the URL Shouldn't Change

These actions are generally more subtle and don't require a context switch for the user:

- **Updating a Single Field**: Maybe a user wants to change the name of an item in a list or update a specific property of a record. This action is minor and doesn't necessitate a new page or URL.

- **Deleting a Record from a List**: In a list view, if a user deletes an item, they likely expect to remain on the list view, with that item no longer in the list.

- **Creating a Record in a List View**: When adding a new item to a list, it often makes sense for the user to remain in that context, seeing their new item added to the list without a full page transition.

- **Loading Data for a Popover or Combobox**: When loading data for a popover or combobox, the user's context remains unchanged. The data is loaded in the background and displayed in a small, self-contained UI element.

For such actions, [`useFetcher`][use-fetcher] is the go-to API. It's versatile, combining functionalities of these APIs, and is perfectly suited for tasks where the URL should remain unchanged.

## API Comparison

As you can see, the two sets of APIs have a lot of similarities:

| Navigation/URL API            | Fetcher API          |
| ----------------------------- | -------------------- |
| `<Form>`                      | `<fetcher.Form>`     |
| `actionData` (component prop) | `fetcher.data`       |
| `navigation.state`            | `fetcher.state`      |
| `navigation.formAction`       | `fetcher.formAction` |
| `navigation.formData`         | `fetcher.formData`   |

## Examples

### Creating a New Record

```tsx filename=app/pages/new-recipe.tsx lines=[16,23-24,29]
import {
  Form,
  redirect,
  useNavigation,
} from "react-router";
import type { Route } from "./+types/new-recipe";

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const errors = await validateRecipeFormData(formData);
  if (errors) {
    return { errors };
  }
  const recipe = await db.recipes.create(formData);
  return redirect(`/recipes/${recipe.id}`);
}

export function NewRecipe({
  actionData,
}: Route.ComponentProps) {
  const { errors } = actionData || {};
  const navigation = useNavigation();
  const isSubmitting =
    navigation.formAction === "/recipes/new";

  return (
    <Form method="post">
      <label>
        Title: <input name="title" />
        {errors?.title ? <span>{errors.title}</span> : null}
      </label>
      <label>
        Ingredients: <textarea name="ingredients" />
        {errors?.ingredients ? (
          <span>{errors.ingredients}</span>
        ) : null}
      </label>
      <label>
        Directions: <textarea name="directions" />
        {errors?.directions ? (
          <span>{errors.directions}</span>
        ) : null}
      </label>
      <button type="submit">
        {isSubmitting ? "Saving..." : "Create Recipe"}
      </button>
    </Form>
  );
}
```

The example leverages [`<Form>`][form-component], component props, and [`useNavigation`][use-navigation] to facilitate an intuitive record creation process.

Using `<Form>` ensures direct and logical navigation. After creating a record, the user is naturally guided to the new recipe's unique URL, reinforcing the outcome of their action.

The component props bridge server and client, providing immediate feedback on submission issues. This quick response enables users to rectify any errors without hindrance.

Lastly, `useNavigation` dynamically reflects the form's submission state. This subtle UI change, like toggling the button's label, assures users that their actions are being processed.

Combined, these APIs offer a balanced blend of structured navigation and feedback.

### Updating a Record

Now consider we're looking at a list of recipes that have delete buttons on each item. When a user clicks the delete button, we want to delete the recipe from the database and remove it from the list without navigating away from the list.

First, consider the basic route setup to get a list of recipes on the page:

```tsx filename=app/pages/recipes.tsx
import type { Route } from "./+types/recipes";

export async function loader({
  request,
}: Route.LoaderArgs) {
  return {
    recipes: await db.recipes.findAll({ limit: 30 }),
  };
}

export default function Recipes({
  loaderData,
}: Route.ComponentProps) {
  const { recipes } = loaderData;
  return (
    <ul>
      {recipes.map((recipe) => (
        <RecipeListItem key={recipe.id} recipe={recipe} />
      ))}
    </ul>
  );
}
```

Now we'll look at the action that deletes a recipe and the component that renders each recipe in the list.

```tsx filename=app/pages/recipes.tsx lines=[10,21,27]
import { useFetcher } from "react-router";
import type { Recipe } from "./recipe.server";
import type { Route } from "./+types/recipes";

export async function action({
  request,
}: Route.ActionArgs) {
  const formData = await request.formData();
  const id = formData.get("id");
  await db.recipes.delete(id);
  return { ok: true };
}

export default function Recipes() {
  return (
    // ...
    // doesn't matter, somewhere it's using <RecipeListItem />
  )
}

function RecipeListItem({ recipe }: { recipe: Recipe }) {
  const fetcher = useFetcher();
  const isDeleting = fetcher.state !== "idle";

  return (
    <li>
      <h2>{recipe.title}</h2>
      <fetcher.Form method="post">
        <input type="hidden" name="id" value={recipe.id} />
        <button disabled={isDeleting} type="submit">
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </fetcher.Form>
    </li>
  );
}
```

Using [`useFetcher`][use-fetcher] in this scenario works perfectly. Instead of navigating away or refreshing the entire page, we want in-place updates. When a user deletes a recipe, the `action` is called and the fetcher manages the corresponding state transitions.

The key advantage here is the maintenance of context. The user stays on the list when the deletion completes. The fetcher's state management capabilities are leveraged to give real-time feedback: it toggles between `"Deleting..."` and `"Delete"`, providing a clear indication of the ongoing process.

Furthermore, with each `fetcher` having the autonomy to manage its own state, operations on individual list items become independent, ensuring that actions on one item don't affect the others (though revalidation of the page data is a shared concern covered in [Network Concurrency Management][network-concurrency-management]).

In essence, `useFetcher` offers a seamless mechanism for actions that don't necessitate a change in the URL or navigation, enhancing the user experience by providing real-time feedback and context preservation.

### Mark Article as Read

Imagine you want to mark that an article has been read by the current user, after they've been on the page for a while and scrolled to the bottom. You could make a hook that looks something like this:

```tsx
import { useFetcher } from "react-router";

function useMarkAsRead({ articleId, userId }) {
  const marker = useFetcher();

  useSpentSomeTimeHereAndScrolledToTheBottom(() => {
    marker.submit(
      { userId },
      {
        action: `/article/${articleId}/mark-as-read`,
        method: "post",
      },
    );
  });
}
```

### User Avatar Details Popup

Anytime you show the user avatar, you could put a hover effect that fetches data from a loader and displays it in a popup.

```tsx filename=app/pages/user-details.tsx
import { useState, useEffect } from "react";
import { useFetcher } from "react-router";
import type { Route } from "./+types/user-details";

export async function loader({ params }: Route.LoaderArgs) {
  return await fakeDb.user.find({
    where: { id: params.id },
  });
}

type LoaderData = Route.ComponentProps["loaderData"];

function UserAvatar({ partialUser }) {
  const userDetails = useFetcher<LoaderData>();
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (
      showDetails &&
      userDetails.state === "idle" &&
      !userDetails.data
    ) {
      userDetails.load(`/user-details/${partialUser.id}`);
    }
  }, [showDetails, userDetails, partialUser.id]);

  return (
    <div
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <img src={partialUser.profileImageUrl} />
      {showDetails ? (
        userDetails.state === "idle" && userDetails.data ? (
          <UserPopup user={userDetails.data} />
        ) : (
          <UserPopupLoading />
        )
      ) : null}
    </div>
  );
}
```

## Conclusion

React Router offers a range of tools to cater to varied developmental needs. While some functionalities might seem to overlap, each tool has been crafted with specific scenarios in mind. By understanding the intricacies and ideal applications of `<Form>`, `useFetcher`, and `useNavigation`, along with how data flows through component props, developers can create more intuitive, responsive, and user-friendly web applications.

[form-component]: ../api/components/Form
[use-fetcher]: ../api/hooks/useFetcher
[use-navigation]: ../api/hooks/useNavigation
[network-concurrency-management]: ./concurrency
