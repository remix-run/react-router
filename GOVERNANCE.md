# React Router Open Governance Model <!-- omit in toc -->

- [Overview](#overview)
- [Design Goals](#design-goals)
- [Steering Committee](#steering-committee)
- [Bug/Issue Process](#bugissue-process)
- [New Feature Process](#new-feature-process)
- [New Feature Stages](#new-feature-stages)
  - [Stage 0 — Proposal](#stage-0--proposal)
  - [Stage 1 — Consideration](#stage-1--consideration)
  - [Stage 2 — Alpha](#stage-2--alpha)
  - [Stage 3 — Beta](#stage-3--beta)
  - [Stage 4 — Stabilization](#stage-4--stabilization)
  - [Stage 5 — Stable](#stage-5--stable)
- [Meeting Notes](#meeting-notes)

## Overview

React Router has been around since 2014 largely under the development and oversight of [Michael Jackson](https://x.com/mjackson) and [Ryan Florence](https://x.com/ryanflorence). After the launch of [Remix](https://remix.run/) in 2021, the subsequent creation of the Remix team, and the merging of Remix v2 into React Router v7[^1][^2], the project shifted from a [Founder-Leader](https://www.redhat.com/en/blog/understanding-open-source-governance-models) model to a "Steering Committee" (SC) model that operates on a Request for Comments (RFC) process.

[^1]: https://remix.run/blog/merging-remix-and-react-router

[^2]: https://remix.run/blog/incremental-path-to-react-19

This document will outline the process in which React Router will continue to evolve and how new features will make their way into the codebase. This is an evergreen document and will be updated as needed to reflect future changes in the process.

## Design Goals

The following design goals should be considered when considering RFCs for acceptance:

- **Less is More**. React Router has gained a _lot_ of functionality in the past years, but with that comes a bunch of new API surface. It's time to hone in on the core functionality and aim to reduce API surface _without sacrificing capabilities_. This may come in multiple forms, such as condensing a few existing APIs into a singular API, or deprecating current APIs in favor of a new React API.
- **Routing and Data Focused.** Focus on core router-integrated/router-centric APIs and avoid adding first-class APIs that can be implemented in user-land
- **Simple Migration Paths.** Major version upgrades don't have to stink. Breaking changes should be implemented behind future flags. Deprecations should be properly marked ahead of time in code and in documentation. Console warnings should be added prior to major releases to nudge developers towards the changes they can begin to make to prep for the upgrade.
- **Lowest Common Mode.** Features are added at the lowest mode possible (`declarative -> data -> framework`) and then leveraged by the higher-level modes. This ensures that the largest number of React Router applications can leverage them.
- **Regular Release Cadence**. Aim for major SemVer releases on a ~yearly basis so application developers can prepare in advance.

## Steering Committee

The Steering Committee will be in charge of accepting RFC's for consideration, approving PRs to land features in an "unstable" state, and approving stabilization PRs to land PRs that stabilize features into React Router.

The SC will initially consist of the Remix team developers:

- Matt Brophy ([`@brophdawg11`](https://github.com/brophdawg11))
- Pedro Cattori ([`@pcattori`](https://github.com/pcattori))
- Mark Dalgleish ([`@markdalgleish`](https://github.com/markdalgleish))
- Jacob Ebey ([`@jacob-ebey`](https://github.com/jacob-ebey))
- Brooks Lybrand ([`@brookslybrand`](https://github.com/brookslybrand))
- Sergio Xalambrí ([`@sergiodxa`](https://github.com/sergiodxa))
- Bryan Ross ([`@rossipedia`](https://github.com/rossipedia))

In the future, we may add a limited number of heavily involved community members to the SC as well.

To reduce friction, the SC will primarily operate asynchronously via GitHub, but private and/or public meetings may be scheduled as needed.

## Bug/Issue Process

Due to the large number of React Router applications out there, we have to be a bit strict on the process for filing issues to avoid an overload in GitHub.

- **All** bugs must have a **minimal** and **runnable** reproduction [^3]
  - _Minimal_ means that it is not just pointing to a deployed site or a branch in your existing application
  - _Runnable_ means that it is a working application where we can see the issue, not just a few snippets of code that need to be manually reassembled into a running application
  - The preferred methods for reproductions are:
    - **Framework Mode**: [StackBlitz](https://reactrouter.com/new) or a GitHub fork with a failing integration test based on [`bug-report-test.ts`](integration/bug-report-test.ts)
    - **Data/Declarative Modes**: [CodeSandbox (TS)](https://codesandbox.io/templates/react-vite-ts) or [CodeSandbox (JS)](https://codesandbox.io/templates/react-vite)
  - If StackBlitz/CodeSandbox is not an option, a GitHub repo based on a fresh `npx create-react-router` app is acceptable
  - Only in extraordinary circumstances will code snippets or maximal reproductions be accepted
- Issue Review
  - Issues not meeting the above criteria will be closed and pointed to this document
  - Non-issues (feature requests, usage questions) will also be closed with a link to this document
  - The SC will triage issues regularly
- Fixing Issues
  - The SC will mark good community issues with an `Accepting PRs` label
  - These issues will generally be ones that are likely to have a small surface area fix
  - However, anyone can work on any issue, but there's no guarantee the PR will be accepted if the surface area is too large for expedient review by a core team member

[^3]: https://antfu.me/posts/why-reproductions-are-required

## New Feature Process

The process for new features being added to React Router will follow a series of stages loosely based on the [TC39 Process](https://tc39.es/process-document/). It is important to note that entrance into any given stage does not imply that an RFC will proceed any further. The stages will act as a funnel with fewer RFCs making it into later stages such that only the strongest RFCs make it into a React Router release in a stable fashion.

> [!NOTE]
> Most new community-driven features for React Router will go through all stages. Some features, if trivial or obvious enough, may skip stages and be implemented directly as a stable feature.

This table gives a high-level overview of the stages, but please see the individual stage sections below for more detailed information on the stages and the process for moving an FC through them. Once a feature reaches Stage 2, it will be added to the [Roadmap](https://github.com/orgs/remix-run/projects/5) where it can be tracked as it moves through the stages.

| Stage | Name          | Entrance Criteria                                                                                                                      | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Proposal      | Proposal discussion opened on GitHub                                                                                                   | We start with a GitHub Proposal to provide the lowest barrier to RFC submission. Anyone can submit an RFC and community members can review, comment, up-vote without any initial involvement of the SC.                                                                                                                                                                                                                                                                           |
| 1     | Consideration | Proposal acceptance from 2 SC members                                                                                                  | The consideration phase is the first "funnel" for incoming RFCs where the SC can officially express interest in the more popular RFCs. We only require 2 SC members to express interest to move an RFC into the **Consideration** phase to allow for low-friction experimentation of features in the **Alpha** stage.                                                                                                                                                             |
| 2     | Alpha         | Pull request (PR) opened to implement the feature in an "unstable" state                                                               | The **Alpha** stage is the next funnel for RFCs. Once interest has been expressed by the SC in the **Consideration** phase we open the RFC up for a sample PR implementation and a mechanism for community members to alpha test the feature without requiring that anything be shipped in a React Router SemVer release. This stage allows evaluation of the RFC in running applications and consideration of what a practical implementation of the RFC looks like in the code. |
| 3     | Beta          | PR approval from 2 SC members indicating their acceptance of the PR for an unstable API                                                | A RFC enters the **Beta** stage once enough members of the SC feel comfortable not only with the code for the beta feature, but have also seen positive feedback from alpha testers that the feature is working as expected. Once an **Alpha** stage PR has enough SC approvals, it will be merged and be included in the next React Router release.                                                                                                                              |
| 4     | Stabilization | At least 1 month in the Beta stage and PR opened to stabilize the APIs. This PR should also include documentation for the new feature. | The **Stabilization** phase exists to ensure that unstable features are available for enough time for applications to update their React Router version and opt-into beta testing. We don't want to rush features through beta testing so that we have maximal feedback prior to stabilizing a feature.                                                                                                                                                                           |
| 5     | Stable        | PR approval from at least 50% of the SC members indicating their acceptance of the PR for a stable API                                 | A RFC is completed and enters the **Stable** stage once enough members of the SC feel comfortable not only with the code for the stable feature, but have also seen positive feedback from beta testers that the feature is working as expected. Once an **Beta** stage PR has enough SC approvals and has spent the required amount of time in the **Beta** stage, it can be merged and included in the next React Router release.                                               |

## New Feature Stages

### Stage 0 — Proposal

- All new features begin at **Stage 0 — Proposal** when a Request For Comments (RFC) is written up in a GitHub Proposal Discussion
- Anyone can write an RFC, including core team members and community members
- The RFC should outline the use-case for the new feature, why current APIs are insufficient for the use-case, and provide potential API surfaces for the feature
- The proposal should be clear, concise, and provide enough context for the Steering Committee (SC) and community to evaluate its merit
- Community upvotes on the proposal are used as a signal of interest and demand for the SC — higher upvoted issues are more likely to be considered by the SC members
- At this stage, community members may feel free to work on sample implementations in a fork of the repo and provide links in the RFC, but a pull request **should not** be opened until it reaches Stage 1

### Stage 1 — Consideration

- A proposal enters **Stage 1 — Consideration** when 2 SC members indicate interest/support for the idea as a valuable addition to React Router
- These initial supporting SC members will be the champions for the feature and will be loosely responsible for shepherding the feature through the stages of the RFC process
- At this stage, the proposal is eligible for a sample PR implementation from a core team or community member
- The SC will indicate at this stage if this is a feature open to a community PR or something the core team would prefer to tackle
- We will add the `accepting-prs` label to the RFC if we are open to community PRs
- All PRs at this stage should implement the feature in an "unstable" fashion (usually using an `unstable_` prefix on the future flag or API)

### Stage 2 — Alpha

- A proposal enters **Stage 2 — Alpha** once a PR has been opened implementing the feature in an `unstable_` state
- At this stage, we should open an Issue for the Proposal and add it to the [Roadmap](https://github.com/orgs/remix-run/projects/5)
- We will remove any `accepting-prs` label and add the `🗺️ Roadmap` label to indicate that this RFc is officially on the roadmap
- At this stage, we are looking for early community testing _before_ merging any work to the React Router repo — so these PRs should provide a mechanism for community members to opt into to alpha testing
  - Maintainers can trigger an alpha release from the PR branch by adding the `alpha-release` label, which will kick off an experimental release and comment it back on the PR
  - Because the alpha release may contain other work committed to `dev` but not yet released in a stable version, it may not be ideal for testing in all cases
  - In these cases, PR authors may also add the contents for a `.patch` file in a comment that folks can use via [patch-package](https://www.npmjs.com/package/patch-package) or [pnpm patch](https://pnpm.io/cli/patch)
- Feedback from alpha testers is considered essential for further progress
- The PR should also contain a changeset documenting the new API for the release notes
- SC members will review and approve the PR via GitHub reviews
- Approval at this stage communicates:
  - The feature is valuable for React Router
  - The API/code is sufficient for unstable/beta testing, though further iteration may be needed
  - Code is not required to be in a final state yet, but it must be coded in such a way so as not to introduce regressions to other areas of the API
  - We have seen enough positive feedback from Alpha testers to move the feature along

### Stage 3 — Beta

- A proposal enters **Stage 3 — Beta** once it receives **Stage 2 — Alpha** PR approvals from 2 SC members and is merged to `dev`
  - An SC member authoring the `unstable_` PR counts as an implicit approval, so in those cases explicit approval is required from 1 additional SC member
- This will include the feature in `nightly` releases and the next normal SemVer release for broader beta testing under the `unstable_` flag

### Stage 4 — Stabilization

- A proposal enters **Stage 4 — Stabilization** after a minimum of 1 month in **Stage 3 — Beta** and a PR has been opened to remove the `unstable_` prefixes and stabilize the feature
- Stabilization PRs should add proper documentation for the feature
- SC members will review and approve the PR via GitHub reviews
- Approval at this stage communicates:
  - Sufficient community feedback has been received from beta testers to trust the API's design and implementation
  - The code is production-quality and well-tested, with no related regressions
  - The PR includes documentation for the stable feature

### Stage 5 — Stable

- A proposal enters **Stage 5 — Stable** once it receives **Stage 4 — Stabilization** PR approvals from at least 50% of the SC members and is merged to `dev`
  - An SC member authoring the stabilization PR counts as an implicit approval
- This will include the stable feature in `nightly` releases and the next normal SemVer release

## Meeting Notes

This section captures the notes from the React Router Steering Committee meetings:

<!-- TEMPLATE
<details>
  <summary>YYYY-MM-DD Meeting Notes</summary>

  ...
</details>
-->

<details>
<summary>2025-09-23 Meeting Notes</summary>

**Summary**

Brooks announced the planned release of unstable framework RSC support in 7.9.2 and the `fetcher.unstable_reset()` API. Matt and Pedro discussed splitting Ryan's proposal for `useRouteLoaderData` type-safety to separate "router data" from "route data." Bryan and Matt reviewed the proposal for new instrumentation APIs. Matt and Jacob decided to close several issues related to ESLint configuration, OpenTelemetry, and module federation.

**Details**

- 7.9.2 will contain unstable support for RSC framework mode as well as the `fetcher.unstable_reset()` API
- The team reviewed the current instrumentation POC implementation:
  - RFC: https://github.com/remix-run/react-router/discussions/13749
  - POC PR: https://github.com/remix-run/react-router/pull/14377
  - Current `instrumentRouter`/`instrumentRoutes` APIs should be sufficient for various implementations of logging/tracing layered on top
  - React Router docs can show simple examples of a few types of observability implementations (logging, OTEL, `performance.mark`/`measure`), but will lean on the community to provide packages for specific observability approaches
  - Jacob raised a good point about the design of the current APIs permitting more than instrumentation because folks could mutate existing handler parameters, so Matt is going to look into ways top provide a subset of read-only information that will prohibit this since it is not an intended use case and would likely be abused in unforeseen ways
  - Matt will also play around with potential instrumentation utils to see if it is worth shipping anything or just putting them in documentation
- The committee reviewed and agreed to move forward 2 new RFCs to the "consideration" stage:
  - [Prerender concurrency](https://github.com/remix-run/react-router/discussions/14080)
  - [Per-route Layout component](https://github.com/remix-run/react-router/discussions/13818)
- Matt will comment back on the ESLint issue to get it closed out and point to the OpenTelemetry issue to the new instrumentation approach
- Pedro will start on the route stuff and try to get a PR up for it, once a PR is opened we will also get an issue on the roadmap
- Jacob will check in with Zach about his interest in the [current work w.r.t. module imports](https://github.com/remix-run/react-router/pull/12638), and Matt will add a comment to the issue asking if it is needed and close it if there is no response in a week.

</details>

<details>
<summary>2025-09-08 Meeting Notes</summary>

**Summary**

Matt, Bryan, Mark, and Pedro discussed the progress of various features, including middleware, context, the `onError` feature, and RSC framework mode, with most nearing completion or already released. Matt and Bryan also explored the integration of observability and OpenTelemetry with Sentry and React Router, considering OpenTelemetry as a potential standard for JavaScript monitoring. The team decided to focus on current in-progress items instead of reviewing and accepting additional proposals because there are already 10+ proposals in-progress.

**Details**

- Roadmap Review and Release Progress
  - Matt initiated the meeting by reviewing the public roadmap, starting with [middleware](https://github.com/remix-run/react-router/issues/12695) and [context](https://github.com/remix-run/react-router/issues/14055), which are merged to dev and awaiting a pre-release for version 7.9.0
  - Bryan confirmed that the [`onError`](https://github.com/remix-run/react-router/issues/12958) feature, released in 7.8.2, is working as expected and providing anticipated data
  - Mark noted that the RSC framework mode initial release will not be feature complete but is nearing completion, with the main remaining task being error handling during rendering ([RFC](https://github.com/remix-run/react-router/issues/11566))
- Upcoming Features and API Discussions
  - Pedro discussed the `useRouterState` hook, noting that Ryan's attention is elsewhere, but they are interested in revisiting it for type safety and potentially replacing the `useRouteLoaderData` hook
  - Brooks and Pedro agreed that the `use matches` API is problematic, especially concerning type safety, and suggested finding a solution that does not rely on it
  - We may be able to keep the distinction that hooks for use in data mode are less type-safe than the typegen equivalents in framework mode, so it might be ok for `useRouterState().matches` to be less type-safe than `Route.ComponentProps["matches"]`
  - [RFC](https://github.com/remix-run/react-router/issues/13073)
- Observability and OpenTelemetry Integration
  - Matt and Bryan discussed the [observability](https://github.com/remix-run/react-router/discussions/13749) feature, which aims to improve Sentry's integration with React Router Apps
  - Bryan explained that a strict event-based system would not support OpenTelemetry because OpenTelemetry requires bounding code execution within a span, unlike events which are instantaneous
  - They are considering whether React Router should fully embrace OpenTelemetry as it appears to be becoming a de facto standard for JavaScript monitoring, which could potentially replace the need for a separate event system
- Meeting Wrap-up and Next Steps
  - Matt announced that the pre-release for version 7.9.0 would be shipped shortly, with the full release expected by the end of the week
  - Bryan confirmed that the duplicate loader issue fix will be included in this release
  - The team decided not to overload themselves with additional tasks, focusing on the current in-progress items

**Action Items**

- Mark will work on stabilizing the split route modules and Vite environment API flags
- Matt will read through the SvelteKit blog post to understand their approach to OpenTelemetry integration
- Matt will merge the unstable [`fetcher.reset()`](https://github.com/remix-run/react-router/issues/14207) work after 7.9.0 is released ()
- Matt will try to pick up the [`<Link onPrefetch>`](https://github.com/remix-run/react-router/discussions/12375) task soon
- Matt and Pedro will sync up offline to figure out what parts of the consolidated hook can be done better with typegen and decide on the requirements ([RFC](https://github.com/remix-run/react-router/issues/13073))
</details>

<details>
<summary>2025-11-04 Meeting Notes</summary>

The SC reviewed items on the open Proposal for React Router v8

- Confirmed the plan to drop CJS builds for ESM-only builds
  - We will plan RR v8 for Q2 2026 which aligns nicely with the EOL for Node 20
  - v8 will have a minimum Node version of 22.12 so that the `require(esm)` feature is not behind an [experimental flag](https://nodejs.org/docs/latest-v22.x/api/modules.html#loading-ecmascript-modules-using-require)
- Going forward we will aim for a yearly major release in the same Q2 timeframe
- We would like to try to get `useRouterState` into v8 as the other half of the `unstable_useRoute` coin
- We think Subresource Integrity (SRI) is ready for stabilization but we would like to ping a few existing users and/or SME's to confirm the implementation is valid
- Discussed the `unstable_optimizedDeps` feature, confirming it will remain unstable in V8 and then be pseudo-deprecated in favor of RollDown
  - There are some concerns about RollDown's full bundle mode limiting scalability so we may need to wait until rolldown is ready for testing
- Decided against making "type-safe matches" an immediate V8 necessity due to the API churn
- RSC implementation will not have a stable API ready for V8 but will be released in a minor version later
  - We will not be deprecating existing APIs at that time because not everyone should have to use RSC
- `Vite environment API` and `split route modules` are nearing stabilization
- Reviewed a new RFC to stop URL normalization in loaders

</details>

<details>
<summary>2025-11-18 Meeting Notes</summary>

Matt mentioned opening Pull Requests (PRs) to stabilize `fetcher.reset` and `onError` for client-side use

**Stabilizing Fetcher Reset and Client-Side Error Handling**

Matt mentioned opening Pull Requests (PRs) to stabilize `fetcher.reset` and `onError` for client-side use. For client-side `onError`, Matt made a change to align it with `handleError` on the server by passing the `location` and `params` to the error handler, with the goal of not holding off on stabilizing the API . Bryan suggested considering adding the pattern to the error information, which Matt agreed would be useful for filtering errors in Sentry.

**Stabilizing Other Router APIs**

Matt confirmed with Mark that both `split route modules` and the `environment API` are ready to be stabilized. The intent is to batch these stabilizations into a minor release. Other features like observability and a transition flag are still too new for stabilization

**Opt-Out Flag for Custom Navigations**

Matt discussed fast-tracking a flag to allow users to opt out of wrapping their own navigations in `startTransition`. This is needed because the current implementation has bugs related to navigation state not surfacing when custom navigations are wrapped in `startTransition`, particularly affecting `useSyncExternalStore` and causing minor tearing issues with search params. Matt mentioned we could fork off and ship the `false` (opt-out) version of this unstable flag quickly if needed.

**Type-Safe Fetchers Discussion**

The discussion moved to the highly-anticipated type-safe fetchers feature. Bryan suggested that the definition of a fetcher should be tied to a route at creation time, as fetchers resolve to a single handler (action or loader), where all the type signature glue happens . A challenge is resolving ambiguity when a path matches multiple loaders, such as a layout route and an index route.

**Route ID vs. Pattern for Type-Safe Fetchers**

The group debated using route ID versus the path pattern for identifying the route. Bryan and Jacob agreed that parameters should be accepted at the invocation site of the fetcher. Mark raised concerns that using route ID might require querying the full manifest, which could be problematic with "fog of war" architectures where only a small number of routes are known at runtime. They agreed to use the pattern instead, which doubles as the route ID in a sense and does not require querying the manifest for URL construction.

**Proposed New Hooks for Type-Safe Fetchers**

Bryan proposed splitting `useFetcher` into two separate hooks: `useRouteLoader` and `useRouteAction`, bound explicitly to a loader and an action, respectively. This separation is beneficial because a loader is primarily concerned with the GET method, while an action can handle multiple methods (POST, PUT, etc.). The new hooks would return an array with the state/data object and the imperative method (like `submit` or `load`), a pattern which Matt and Mark liked.

**Streamlining State Tracking with React APIs**

The conversation shifted towards aligning the new hooks with modern React APIs, especially those from React 19. Bryan suggested that the router could offload state tracking to userland by using React's `useTransition` and `useOptimistic` hooks, leading to a much slimmer abstraction. This would replace the existing `fetcher.state` (idle, loading, submitting) and `fetcher.form`.

**Leveraging Use Action State and Form Actions**

Jacob noted that using an asynchronous function for a form's action would also allow for use of the `useActionState` hook from React, which can track the pending status of the form, further streamlining the API. This design would also enable the deprecation of `fetcher.form` in favor of a standard React form. However, the group noted that this approach would be for JS-supported forms and not progressively enhanced forms in an RSC world without JavaScript.

**Call Site Revalidation Opt-Out**

The group discussed the community PR for a call site revalidation opt-out, specifically the open question of whether a call site option like `shouldRevalidate: false` should override a route's existing `shouldRevalidate` function. Jacob and Bryan agreed with Sergio's recommendation that the call site option should set the new default value passed to the routes, essentially bubbling up, to avoid potential support headaches and data integrity issues that would arise from overriding all revalidation.

**Naming Convention for Revalidation Opt-Out**

Bryan suggested a minor design point to name the option passed to `submit` as `defaultShouldRevalidate` for consistency. Matt agreed with this suggestion.
Default Route Revalidation Behavior Bryan and Matt discussed the implementation of a default setting for route revalidation, with Bryan expressing concern that people might misuse a hard bypass but agreeing that passing in a default allows the route logic to still determine the revalidation. Matt highlighted that this default would be an easy win for applications with many routes that need a common revalidation behavior, preventing the need to change fifty routes, while still allowing specific routes with their own logic to override the default. They agreed that the route should always be the final authority on revalidation.

**Scope and Granularity of Default Revalidation**

Jacob proposed setting a specific route default, perhaps for parent routes but not a view, for scenarios involving submissions, but Matt dismissed this, noting that routes already have a specific place for their logic in the route function. Bryan also suggested that more granular control would lead to excessive complexity. The team concluded that the default should not allow a function, as Jacob argued it should be derived from local state.

**Implementation of 'default revalidate'**

Matt confirmed liking the name "default revalidate" and determined that it should apply to all imperative hooks, including navigates and submits. Bryan and Matt agreed that having the routes maintain final control of revalidation makes sense on navigates. Matt mentioned that there is an existing Pull Request for this feature, which they plan to update.

</details>

<details>
<summary>2025-12-02 Meeting Notes</summary>

**Meeting Status and Stabilizations**

Matt shared that three stabilizations were pushed out: `environment API future flag`, `split route modules future flag`, and `fetch error reset`. Matt noted that `onError` would be in the next release after one last internal refactor to address potential double reporting issues in strict mode.

**`use route` and Type-Safe Fetchers**

Matt discussed the plan to complete the other half of `use route`, the `use router state` functionality, and treating them as a package deal for stabilization. Pedro agreed, emphasizing the need for the type-safe fetcher approach to be cohesive with `use route` before stabilization, to avoid having multiple ways of doing things if the ID-based approach is changed later.

**Babel to SWC/Oxide Migration for Performance**

Mark raised the proposal to switch from Babel to SWC/Oxide for speed improvements, noting that the stabilization of `split route modules` increases the amount of transformations happening in Babel. Pedro expressed support for making things faster but questioned the priority, as they have yet to see a real use case where Babel is the bottleneck, suggesting current HMR times are sub-40 milliseconds.

**Performance Bottlenecks and Rollup Integration**

Pedro explained that a larger architectural problem, the necessity of a full pass over all routes for manifest creation, contributes to performance issues, making the dev server launch time proportional to the number of routes. Mark clarified that Rollup speeds up the build, not dev, and Pedro suggested profiling to determine if Babel is truly the bottleneck out of the 50 milliseconds of overhead. Matt suggested involving the community for hard numbers and potentially waiting to see if Rollup with an AST pipeline API would alleviate the issue, which might necessitate rewriting transforms anyway. Matt asked Mark and Pedro to comment on the proposal, indicating interest but needing more evidence of the bottleneck.

**Fetcher Error Handling and Imperative Usage**

Discussion returned to an existing, highly voted proposal concerning fetcher error handling and completion. Matt noted that returning promises from `fetcher.load` and `fetcher.submit` partially solved the completion concern, but returning the data is still missing. The other main request is to prevent fetcher errors from triggering the route-level error boundary, for which Matt suggested an opt-in mechanism like `don't bubble errors` or a `handle error` option. Bryan argued that fetchers, being out-of-band network requests, should not bubble up to the route error boundary naturally.

**Inline Action Approach for Fetcher Error Handling**

The discussion moved towards an inline action approach for error handling, aligning with `client loader` mechanisms, as suggested by Jacob. Matt and Bryan considered how an inline handler could allow users to catch network errors and decide whether to return errors as data or throw. Sergio Daniel Xalambrí questioned whether these changes should be applied to the new type-safe fetchers (e.g., `use route action`) instead of evolving `use fetcher`. Matt and Bryan agreed that implementing this work within the new type-safe fetcher APIs, where `submit` would return data and reject on errors, seems like the most appropriate approach.

**Route Masking/Rewrites for Modals**

Matt introduced a resurfaced, high-priority proposal for route masking/rewriting, similar to Next.js's parallel/intercepting routes or Tanstack's route masking. This feature, previously available in declarative mode, allows rendering a modal over a background URL while maintaining a different URL in the bar. Matt suggested an API where the user provides the URL to be displayed in the URL bar, and the router navigates internally to a different URL, likely driven by search parameters. Mark and Bryan agreed that this seems coupled to client-side navigation for UX cases like job details over search results.

**Server Rewrites and Client Router Synchronization**

Sergio Daniel Xalambrí noted that people often ask for server rewrites, which in Next.js terms often means URL aliases where a path renders the content of another route, potentially with param rewriting. Matt concluded that true server rewrites are a separate feature but noted that implementing the client-side masking feature would close the gap on what is needed to synchronize rewrite logic with the client router, potentially unlocking future server-side rewrite capabilities. Matt intends to update the proposal and move it to the "accepting PRs" stage, noting that the implementation could draw on internals from V6.

**Element Scroll Restoration**

The last topic discussed was a high-voted proposal for scroll restoration on elements other than the window. Matt explained that a full userland implementation is not reliably possible because the router is the only one that truly knows the moment right before a view changes to reliably capture the scroll position. Matt plans to provide guidance and feedback based on previous PR discussions, hoping the community can finalize the implementation.

</details>
