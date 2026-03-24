# React Router Development

## Releases

Releases are handled by a mostly automated process consisting of:

- Manual [`start-release.sh`](./scripts/changes/start-release.sh)/[`finish-release.sh`](./scripts/changes/finish-release.sh) scripts
- Typescript scripts in [`scripts/changes/`](./scripts/changes/)
- The [release.yml](./.github/workflows/release.yml) Github workflow

When you are ready to begin the release process:

- Start with a clean git working directory on the `dev` branch
- Run `./scripts/changes/start-release.sh`
  - creates the `release` branch from `dev`
  - merges in latest `main`
  - pushes to the origin
- The `release.yml` workflow will see the `release` branch with change files in it:
  - This triggers the "PR" step (`scripts/changes/pr.ts`)
  - This will create a new branch from `release`
  - Update the versions in the new branch
  - Generate the proper `CHANGELOG.md` entries
  - Delete the change files
  - Open a PR to the `release` branch
- Once that PR is merged, the `release.yml` workflow will run again against `release` and see no change files:
  - This triggers the "publish" step (`scripts/changes/publish.ts`)
  - Publishes all packages to npm
  - Tags the commits and pushes tags to the origin
  - Creates a github release
- Run `./scripts/changes/finish-release.sh`
  - Merges the `release` branch into `dev` and `main` and pushes to origin
  - Deletes the `release` branch

### Iterating a pre-release

You may need to make changes to a pre-release prior to publishing a final stable release. To do so:

- Branch off of `release` and make whatever changes you need
- Add changes files as needed
- Push your branch to GitHub and PR it to `release`
- Once reviewed/approved, merge the PR to the `release` branch
- This will trigger an update of the release PR created above

### Hotfix releases

TODO:
