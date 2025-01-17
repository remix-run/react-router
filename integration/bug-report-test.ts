import { test, expect } from "@playwright/test";

import { PlaywrightFixture } from "./helpers/playwright-fixture.js";
import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

////////////////////////////////////////////////////////////////////////////////
// 💿 👋 Hola! It's me, Dora the Remix Disc, I'm here to help you write a great
// bug report pull request.
//
// You don't need to fix the bug, this is just to report one.
//
// The pull request you are submitting is supposed to fail when created, to let
// the team see the erroneous behavior, and understand what's going wrong.
//
// If you happen to have a fix as well, it will have to be applied in a subsequent
// commit to this pull request, and your now-succeeding test will have to be moved
// to the appropriate file.
//
// First, make sure to install dependencies and build Remix. From the root of
// the project, run this:
//
//    ```
//    pnpm install && pnpm build
//    ```
//
// Now try running this test:
//
//    ```
//    pnpm bug-report-test
//    ```
//
// You can add `--watch` to the end to have it re-run on file changes:
//
//    ```
//    pnpm bug-report-test --watch
//    ```
////////////////////////////////////////////////////////////////////////////////

test.beforeEach(async ({ context }) => {
  await context.route(/\.data$/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    route.continue();
  });
});

test.beforeAll(async () => {
  fixture = await createFixture({
    ////////////////////////////////////////////////////////////////////////////
    // 💿 Next, add files to this object, just like files in a real app,
    // `createFixture` will make an app and run your tests against it.
    ////////////////////////////////////////////////////////////////////////////
    files: {
      "app/routes.ts": js`
        import { type RouteConfig, route } from "@react-router/dev/routes";

        export default [
            route('organizations/:orgId', 'routes/organizations.tsx', [
                route("users", "routes/organization-users.tsx"),
            ])
        ] satisfies RouteConfig;
      `,

      'app/routes/organizations.tsx': js`
        import {type LoaderFunctionArgs, Outlet, redirect, useLoaderData} from "react-router";
        
        export const loader = async ({params, request}: LoaderFunctionArgs) => {
            const { orgId }  = params;
            
            const delay = orgId === 'justpark' ? 200 : 0;
        
            const org = new Promise((resolve) => {
              setTimeout(() => resolve('JustPark'), delay);
            });
        
            return {
                organisation: await org
            };
        }
        
        export default () => {
            const data = useLoaderData<typeof loader>();
        
            return <>
                <h1>{data.organisation}</h1>
                <Outlet />
            </>;
        };
      `,
      'app/routes/organization-users.tsx' : js`
        import {Await, useAsyncError, useLoaderData} from "react-router";
        import {Suspense} from "react";
        
        export const loader = async () => {
            return {
                users: new Promise((resolve, reject) => {
                  setTimeout(() => reject(new Error('500: Unexpected server error')), 100);
                })
            };
        }
        
        const ErrorComponent = () => {
            const errorResponse = useAsyncError();
            return <div id="error-component">{errorResponse.message}</div>;
        };
        
        export default () => {
            const data = useLoaderData();
        
            return (<Suspense fallback={"Loading"}>
                <Await resolve={data.users} errorElement={<ErrorComponent />} children={(users) =>
                    <ol id="users-list">
                        {users.map((user) => <li key={user.id}>{user.name}</li>)}
                    </ol>
        
                }/>
            </Suspense>);
        };
      `
    },
  });

  // This creates an interactive app using playwright.
  appFixture = await createAppFixture(fixture);
});

test.afterAll(() => {
  appFixture.close();
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Almost done, now write your failing test case(s) down here Make sure to
// add a good description for what you expect Remix to do 👇🏽
////////////////////////////////////////////////////////////////////////////////

test("Can handle returning a rejected promise in a nested route loader where a parent takes longer to resolve without crashing the server", async ({ page }) => {
  let fastOrganisationResponse = await fixture.requestDocument("/organizations/remix/users");
  expect(await fastOrganisationResponse.text()).toMatch("<div id=\"error-component\">500: Unexpected server error</div>");

  let slowOrganisationResponse = await fixture.requestDocument("/organizations/justpark/users");
  expect(await slowOrganisationResponse.text()).toMatch("<div id=\"error-component\">500: Unexpected server error</div>");
});

////////////////////////////////////////////////////////////////////////////////
// 💿 Finally, push your changes to your fork of Remix and open a pull request!
////////////////////////////////////////////////////////////////////////////////
