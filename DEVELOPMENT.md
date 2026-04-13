# React Router Development

## Releases

Releases are handled by a mostly automated process consisting of:

- Manual [`release.sh`](./scripts/changes/release.sh) scripts to start/finish releases
- Typescript scripts in [`scripts/changes/`](./scripts/changes/)
- The [release.yml](./.github/workflows/release.yml) Github workflow

When you are ready to begin the release process:

- Start with a clean git working directory on the `dev` branch
- Pull latest `dev`
- Manually run `./scripts/changes/release.sh start`
  - creates the `release` branch from `dev`
  - merges in latest `main`
  - pushes to `origin/release`
- The `release.yml` workflow will see the `release` branch with change files in it:
  - This triggers the "PR" step and runs `scripts/changes/pr.ts`
  - This will create a new `release-pr` branch from `release`
  - Runs `scripts/changes/version.ts`
    - Updates versions
    - Generate changelogs
    - Deletes change files
  - Opens a PR to the `release` branch
- Once that PR is merged, the `release.yml` workflow will run again against `release` and see no change files:
  - This triggers the "publish" step and runs `scripts/changes/publish.ts`
  - Publishes all packages to npm
  - Tags the commits and pushes tags to the origin
  - Creates a github release
- Pull latest `release` branch
- Manually run `./scripts/changes/release.sh finish`
  - Merges the `release` branch into `dev` and `main` and pushes to origin
  - Deletes the `release` branch

### Iterating a release branch

You may need to make changes to a release while the release PR is open - to do so:

- Branch off of `release` and make whatever changes you need
- Add changes files as needed
- Push your branch to GitHub and PR it to `release`
- Once reviewed/approved, merge the PR to the `release` branch
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
  - This will create a new branch from `hotfix`
  - Update the versions in the new branch
  - Generate the proper `CHANGELOG.md` entries
  - Delete the change files
  - Open a PR to the `hotfix` branch
- Once that PR is merged, the `release.yml` workflow will run again against `hotfix` and see no change files:
  - This triggers the "publish" step (`scripts/changes/publish.ts`)
  - Publishes all packages to npm
  - Tags the commits and pushes tags to the origin
  - Creates a github release
- Merge the `hotfix` branch into `dev` and `main` and push to origin
- Deletes the `hotfix` branch
