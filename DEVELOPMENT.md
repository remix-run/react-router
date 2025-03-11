# React Router Development

## Releases

New 7.x releases should be created from release branches originating from the `dev` branch. If you are doing a 6.x release, please see the [v6 section](#v6-releases) below.

When you are ready to begin the release process:

- Make sure you've pulled all the changes from GitHub for both `dev` and `main` branches
  - `git checkout main && git pull origin main`
  - `git checkout dev && git pull origin dev`
- Check out the `dev` branch
  - `git checkout dev`
- Create a new `release-next` branch
  - `git checkout -b release-next`
  - Technically, any `release-*` branch name will work as this is what triggers our GitHub CI workflow that will ultimately publish the release - but we just always use `release-next`
  - We are using `release-v6` for [ongoing v6 releases](#v6-releases)
- Merge `main` into the `release-next` branch
  - `git merge --no-ff main`

Changesets will do most of the heavy lifting for our releases. When changes are made to the codebase, an accompanying changeset file should be included to document the change. Those files will dictate how Changesets will version our packages and what shows up in the changelogs.

### Starting a new pre-release

- Ensure you are on the new `release-next` branch
  - `git checkout release-next`
- Enter Changesets pre-release mode using the `pre` tag:
  - `pnpm changeset pre enter pre`
- Commit the change and push the `release-next` branch to GitHub
  - `git commit -a -m "Enter prerelease mode"`
  - `git push --set-upstream origin release-next`
- Wait for the changesets CI workflow to finish which will open a PR pointed to `release-next` that will increment all versions and generate the changelogs
- If you need/want to make any changes to the `CHANGELOG.md` files, you can do so and commit directly to the PR branch
  - This is usually not required for prereleases
- Once the changesets files are in good shape, merge the PR to `release-next`
- Once the PR is merged, the release workflow will publish the updated `X.Y.Z-pre.*` packages to npm

### Prepare the draft release notes

- At this point, you can begin crafting the release notes for the eventual stable release in the root `CHANGELOG.md` file in the repo
  - Copy the commented out template for a new release and update the version numbers and links accordingly
  - Copy the relevant changelog entries from all packages into the release notes and adjust accordingly
    - `find packages -name 'CHANGELOG.md' -mindepth 2 -maxdepth 2 -exec code {} \;`
  - Commit these changes directly to the `release-next` branch - they will not trigger a new prerelease since they do not include a changeset

### Iterating a pre-release

You may need to make changes to a pre-release prior to publishing a final stable release. To do so:

- Branch off of `release-next` and make whatever changes you need
- Create a new changeset: `pnpm changeset`
  - **IMPORTANT:** This is required even if you ultimately don't want to include these changes in the logs. Remember, changelogs can be edited prior to publishing, but the Changeset version script needs to see new changesets in order to create a new version
- Push your branch to GitHub and PR it to `release-next`
- Once reviewed/approved, merge the PR to the `release-next` branch
- Wait for the release workflow to finish and the Changesets action to open its PR that will increment all versions
  - Note: If more changes are needed you can just merge them to `release-next` and this PR will automatically update in place
- Review the PR, make any adjustments necessary, and merge it into the `release-next` branch
- Once the PR is merged, the release workflow will publish the updated `X.Y.Z-pre.*` packages to npm
- Make sure you copy over the new changeset contents into stable release notes in the root `CHANGELOG.md` file in the repo

### Publishing the stable release

- Exit Changesets pre-release mode in the `release-next` branch:
  - `pnpm changeset pre exit`
- Commit the edited pre-release file along with any unpublished changesets, and push the `release-next` branch to GitHub
- Wait for the release workflow to finish - the Changesets action in the workflow will open a PR that will increment all versions and generate the changelogs for the stable release
- Review the updated `CHANGELOG` files in the PR and make any adjustments necessary
  - `find packages -name 'CHANGELOG.md' -mindepth 2 -maxdepth 2 -exec code {} \;`
  - Our automated release process should have removed prerelease entries
- Finalize the release notes
  - This should already be in pretty good shape in the root `CHANGELOG.md` file in the repo because changes have been added with each prerelease
  - Do a quick double check that all iterated prerelease changesets got copied over
- Merge the PR into the `release-next` branch
- Once the PR is merged, the release workflow will publish the updated packages to npm
- Once the release is published:
  - Pull the latest `release-next` branch containing the PR you just merged
  - Merge the `release-next` branch into `main` **using a non-fast-forward merge** and push it up to GitHub
    - `git checkout main`
    - `git merge --no-ff release-next`
    - `git push origin main`
    - _Note:_ For the `v7.0.0` stable release, there will probably be a bunch of conflicts on `docs/**/*.md` files here because we have made changes to v6 docs but in `dev` we removed a lot of those files in favor of auto-generated API docs. To resolve those conflicts, we should accept the deletion from the `release-next` branch.
  - Merge the `release-next` branch into `dev` **using a non-fast-forward merge** and push it up to GitHub
    - `git checkout dev`
    - `git merge --no-ff release-next`
    - `git push origin dev`
  - Convert the `react-router@6.x.y` tag to a Release on GitHub with the name `v6.x.y` and add a deep-link to the release heading in `CHANGELOG.md`
  - Delete the `release-next` branch locally and on GitHub

### Hotfix releases

Hotfix releases follow the same process as standard releases above, but the `release-next` branch should be branched off latest `main` instead of `dev`. Once the stable hotfix is published, the `release-next` branch should be merged back into both `main` and `dev` just like a normal release.

### v6 releases

6.x releases are managed in a similar process to the above but from the `v6` branch, and they do not automatically merge changes back to `dev`/`main`.

- Changes for 6.x should be PR'd to the `v6` branch with a changeset
- If these changes should also be applied to v7, cherry-pick or re-do those changes against the `dev` branch (including the changeset). These changes will make it to `main` with the next v7 release.
- Starting the release process for 6.x is the same as outlined above, with a few exceptioins:
  - Branch from `v6` instead of `dev`
  - Use `release-v6` instead of `release-next`
  - Do **not** merge `main` into `release-v6`
- Steps:
  - `git checkout v6 && git pull origin v6`
  - `git checkout -b release-v6`
  - `pnpm changeset pre enter pre-v6`
  - The process of the PRs and iterating on prereleases remains the same
- Once the stable release is out:
  - Merge `release-v6` back to `v6` with a **Normal Merge**
  - **Do not** merge `release-v6` to `main`
  - Manually copy the new root `CHANGELOG.md` entry to `main` and `dev`
    - We don't worry about backporting individual `packages/*/CHANGELOG.md` updates to `main` for subsequent v6 releases
  - The _code_ changes should already be in the `dev` branch
    - This should have happened at the time the v6 change was made (except for changes such as deprecation warnings)
    - Confirm that the commits in this release are all included in `dev` already, and if not you can manually bring them over by cherry-picking the commit or re-doing the work

### Experimental releases

Experimental releases and hot-fixes do not need to be branched off of `dev`. Experimental releases can be branched from anywhere as they are not intended for general use.

- Create a new branch for the release: `git checkout -b release-experimental`
- Make whatever changes you need and commit them: `git add . && git commit "experimental changes!"`
- Update version numbers and create a release tag: `pnpm run version:experimental`
- Push to GitHub: `git push origin --follow-tags`
- The CI workflow should automatically trigger from the experimental tag to publish the release to npm
