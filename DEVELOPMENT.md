# React Router Development

## Releases

New releases should be created from release branches originating from the `dev` branch. When you are ready to begin the release process:

- Make sure you've pulled all the changes from GitHub for both `dev` and `main` branches
- Check out the `dev` branch
- Create a new `release-next` branch (eg, `git checkout -b release-next`)
  - Technically, any `release-*` branch name will work as this is what triggers our GitHub CI workflow that will ultimately publish the release - but we just always use `release-next`
  - We are using `release-v6` for [ongoing v6 releases](#6x-releases-from-the-v6-branch)
- Merge `main` into the release branch

Changesets will do most of the heavy lifting for our releases. When changes are made to the codebase, an accompanying changeset file should be included to document the change. Those files will dictate how Changesets will version our packages and what shows up in the changelogs.

### Starting a new pre-release

- Ensure you are on the new `release-next` branch
- Enter Changesets pre-release mode using the `pre` tag:
  - `pnpm changeset pre enter pre`
- Commit the change and push the `release-next` branch to GitHub
  - `git commit -a -m "Enter prerelease mode"`
  - `git push --set-upstream origin release-next`
- Wait for the release workflow to finish - the Changesets action will open a PR that will increment all versions and generate the changelogs
- If you need/want to make any changes to the `CHANGELOG.md` files, you can do so and commit directly to the PR branch
  - This is usually not required for prereleases
- Once the changesets files are in good shape, merge the PR to `release-next`
- Once the PR is merged, the release workflow will publish the updated `X.Y.Z-pre.*` packages to npm

### Prepare the draft release notes

- At this point, you can begin crafting the release notes for the eventual stable release in the root `CHANGELOG.md` file in the repo
  - Copy the template for a new release and update the version numbers and links accordingly
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

### 6.x releases from the `v6` branch

After the `6.25.0` release, we branched off a `v6` branch for continued `6.x` work and merged the `v7` branch into `dev` to begin preparation for the `7.0.0` release. Until we launch `7.0.0`, we need to `6.x` releases in a slightly different manner.

- Changes for 6.x should be PR'd to the `v6` branch with a changeset
- Once merged, cherry-pick or re-do those changes against the `dev` branch so that they show up in v7
  - This does not apply to things like adding deprecation warnings that should not land in v7
  - You should not include a changeset in your commit to `dev`
- Starting the release process for 6.x is the same as outlined above, with a few changes:
  - Branch from `v6` instead of `dev`
  - Use the name `release-v6` to avoid collisions with the ongoing v7 (pre)releases using `release-next`
  - **Do not** merge `main` into the `release-v6` branch
- The process of the PRs and iterating on prereleases remains the same
- Once the stable release is out:
  - Merge `release-v6` back to `v6` with a **Normal Merge**
  - **Do not** merge `release-v6` to `main`
  - Copy the updated root `CHANGELOG.md` entry for the `6.X.Y` release to `main` and `dev`
    - `git checkout main`
    - `git diff react-router@6.X.Y...react-router@6.X.Y -- "***CHANGELOG.md" > ./docs.patch`
    - `git apply ./docs.patch`
    - `git checkout dev`
    - `git apply ./docs.patch`
    - `rm ./docs.patch`
  - Copy the docs changes to `main` so they show up on the live docs site for v6
    - `git checkout main`
    - `git diff react-router@6.X.Y...react-router@6.X.Y docs/ > ./docs.patch`
    - `git apply ./docs.patch`
    - `rm ./docs.patch`
  - The _code_ changes should already be in the `dev` branch
    - This should have happened at the time the v6 change was made (except for changes such as deprecation warnings)
    - Confirm that the commits in this release are all included in `dev` already:
      - I.e., https://github.com/remix-run/react-router/compare/react-router@6.26.1...react-router@6.26.2
      - If one or more are not, then you can manually bring them over by cherry-picking the commit (or re-doing the work)
      - You should not include a changelog in your commit to `dev`
  - Copy the updated changelogs from `release-next` over to `dev` so the changelogs continue to reflect this new 6x release into the v7 releases

### Notes on 7.0.0-pre.N released during the v7 prerelease

During the v7 prerelease, the process for iterating and shipping a new `7.0.0-pre.N` release is slightly more streamlined than the steps outlined [above](#iterating-a-pre-release). Because we want _everything_ in `dev` to ship in the prerelease, cutting a new prerelease is simply:

- Merge `dev` -> `release-next`
- This will include the changesets for changes committed to `dev` since the last prerelease
- This will automatically open a new Changesets PR for the new prerelease version

### Experimental releases

Experimental releases and hot-fixes do not need to be branched off of `dev`. Experimental releases can be branched from anywhere as they are not intended for general use.

- Create a new branch for the release: `git checkout -b release-experimental`
- Make whatever changes you need and commit them: `git add . && git commit "experimental changes!"`
- Update version numbers and create a release tag: `pnpm run version:experimental`
- Push to GitHub: `git push origin --follow-tags`
- The CI workflow should automatically trigger from the experimental tag to publish the release to npm
