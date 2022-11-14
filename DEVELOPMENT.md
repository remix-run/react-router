# React Router Development

## Releases

New releases should be created from release branches originating from the `dev` branch. When you are ready to begin the release process:

- Make sure you've pulled all of the changes from GitHub for both `dev` and `main` branches
- Check out the `dev` branch
- Create a new release branch with the `release-` prefix (eg, `git checkout -b release-v6.5.1`)
  - **IMPORTANT:** The `release-` prefix is important, as this is what triggers our GitHub CI workflow that will ultimately publish the release.
- Merge `main` into the release branch

Changesets will do most of the heavy lifting for our releases. When changes are made to the codebase, an accompanying changeset file should be included to document the change. Those files will dictate how Changesets will version our packages and what shows up in the changelogs.

### Starting a new pre-release

- Ensure you are on the new `release-*` branch
- Enter Changesets pre-release mode using the `pre` tag: `yarn changeset pre enter pre`
- Commit the changesets and push the the `release-*` branch to GitHub; wait for the release workflow to finish and the Changesets action to open its PR that will increment all versions
- Review the updated `CHANGELOG` files and make any adjustments necessary, then merge the PR
- Once the PR is merged, the release workflow will publish the updated packages to npm

### Iterating a pre-release

You may need to make changes to a pre-release prior to publishing a final stable release. To do so:

- Make whatever changes you need
- Create a new changeset: `yarn changeset`
  - **IMPORTANT:** This is required even if you ultimately don't want to include these changes in the logs. Remember, changelogs can be edited prior to publishing, but the Changeset version script needs to see new changesets in order to create a new version.
- Commit the changesets and push the the `release-*` branch to GitHub; wait for the release workflow to finish and the Changesets action to open its PR that will increment all versions
- Review the updated `CHANGELOG` files and make any adjustments necessary, then merge the PR
- Once the PR is merged, the release workflow will publish the updated packages to npm

### Publishing the stable release

- Exit Changesets pre-release mode: `yarn changeset pre exit`
- Commit the unpublished changesets and push the the `release-*` branch to GitHub; wait for the release workflow to finish and the Changesets action to open its PR that will increment all versions to stable
- Review the updated `CHANGELOG` files and make any adjustments necessary, then merge the PR
- Once the PR is merged, the release workflow will publish the updated packages to npm
- Once the release is published:
  - merge the `release-*` branch into `main` and push it up to github
  - merge the `release-*` branch into `dev` and push it up to github
  - Convert the `react-router@6.x.y` tag to a Release on Github with the name `v6.x.y`
  - Copy the relevant changelog entries from all packages into the Release Notes and adjust accordingly, matching the format used by prior releases

### Experimental releases

Experimental releases and hot-fixes do not need to be branched off of `dev`. Experimental releases can be branched from anywhere as they are not intended for general use.

- Create a new branch for the release: `git checkout -b release-experimental`
- Make whatever changes you need and commit them: `git add . && git commit "experimental changes!"`
- Update version numbers and create a release tag: `yarn run version:experimental`
- Push to GitHub: `git push origin --follow-tags`
- Create a new release for the tag on GitHub to trigger the CI workflow that will publish the release to npm
