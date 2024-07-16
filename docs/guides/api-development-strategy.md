---
title: API Development Strategy
new: true
---

# API Development Strategy

React Router is foundational to your application. We want to make sure that upgrading to new major versions is as smooth as possible while still allowing us to adjust and enhance the behavior and API as the React ecosystem advances.

Our strategy and motivations are discussed in more detail in our [Future Flags][future-flags-blog-post] blog post.

## Future Flags

When an API changes in a breaking way, it is introduced in a future flag. This allows you to opt-in to one change a time before it becomes the default in the next major version.

- Without enabling the future flag, nothing changes about your app
- Enabling the flag changes the behavior for that feature

All current future flags are documented in the [Future Flags Guide](../upgrading/future) to help you stay up-to-date.

## Unstable Flags

Unstable flags are for features still being designed and developed and made available to our users to help us get it right.

Unstable flags are not recommended for production:

- they will change without warning and without upgrade paths
- they will have bugs
- they aren't documented
- they may be scrapped completely

When you opt-in to an unstable flag you are becoming a contributor to the project, rather than a user. We appreciate your help, but please be aware of the new role!

To learn about current unstable flags, keep an eye on the [CHANGELOG](../start/changelog).

### Example New Feature Flow

The decision flow for a new feature looks something like this (note this diagram is in relation to Remix v1/v2 but applies to React Router v6/v7 as well):

![Flowchart of the decision process for how to introduce a new feature][feature-flowchart]

[future-flags-blog-post]: https://remix.run/blog/future-flags
[feature-flowchart]: https://remix.run/docs-images/feature-flowchart.png
[picking-a-router]: ../routers/picking-a-router
