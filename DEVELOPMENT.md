# React Router Development

## Releases

Releases are handled by a mostly automated process consisting of:

- Typescript scripts in [`scripts/changes/`](./scripts/changes/)
- The [release.yml](./.github/workflows/release.yml) Github workflow

When you are ready to begin the release process:

- Merge all release-bound changes to `main` with their change files
- The `release.yml` workflow will see the `main` branch with change files in it:
  - This triggers the "PR" step and runs `scripts/changes/pr.ts`
  - This will create or update a versioned release branch from `main` such as `release-v7-pr`
  - Runs `scripts/changes/version.ts`
    - Updates versions
    - Generate changelogs
    - Deletes change files
  - Opens a PR from `release-v<major>-pr` to `main`
- Once that PR is merged, the `release.yml` workflow will run again against `main` and see no change files:
  - This triggers the `needs-publish` step, which checks npm to see if the current `react-router` version is already published
  - If publishing is needed, this triggers the "publish" step and runs `scripts/changes/publish.ts`
  - Publishes all packages to npm
  - Tags the commits and pushes tags to the origin
  - Creates a github release
- The `release-v<major>-pr` branch can be deleted after the PR is merged

### Iterating a release PR

You may need to make changes to a release while the release PR is open - to do so:

- Branch off of `main` and make whatever changes you need
- Add changes files as needed
- Push your branch to GitHub and PR it to `main`
- Once reviewed/approved, merge the PR to `main`
- This will trigger an update of the release PR created above

## Hotfix releases

Hotfix releases operate like the above but off of a hotfix branch that is created from the proper version tag we are hotfixing.

- Create a `hotfix` branch from git tag for the release we are hotfixing
  - `git checkout -b hotfix {tag}`
  - `git push origin --set-upstream hotfix`
- Branch from hotfix and make changes
- PR those changes to `hotfix` with a change file
- Merge into `hotfix`
- The `release.yml` workflow will see the `hotfix` branch with change files in it:
  - This triggers the "PR" step (`scripts/changes/pr.ts`)
  - This will create or update a versioned hotfix branch from `hotfix` such as `hotfix-v7-pr`
  - Update the versions in the new branch
  - Generate the proper `CHANGELOG.md` entries
  - Delete the change files
  - Open a PR from `hotfix-v<major>-pr` to the `hotfix` branch
- Once that PR is merged, the `release.yml` workflow will run again against `hotfix` and see no change files:
  - This triggers the "publish" step (`scripts/changes/publish.ts`)
  - Publishes all packages to npm
  - Tags the commits and pushes tags to the origin
  - Creates a github release
- Merge the `hotfix` branch into `main` and push to origin
- Deletes the `hotfix` branch
