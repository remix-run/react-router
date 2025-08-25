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
- Upon entering this stage, a GitHub Issue will be created for the feature and added to the roadmap
- These initial supporting SC members will be the champions for the feature and will be loosely responsible for shepherding the feature through the stages of the RFC process
- At this stage, the proposal is eligible for a sample PR implementation from a core team or community member
- The SC will indicate at this stage if this is a feature open to a community PR or something the core team would prefer to tackle
- All PRs at this stage should implement the feature in an "unstable" fashion (usually using an `unstable_` prefix on the future flag or API)

### Stage 2 — Alpha

- A proposal enters **Stage 2 — Alpha** once a PR has been opened implementing the feature in an `unstable_` state
- At this stage, we should open an Issue for the Proposal and add it to the [Roadmap](https://github.com/orgs/remix-run/projects/5)
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
