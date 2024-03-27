import { test, expect } from "@playwright/test";

import type { Fixture, AppFixture } from "./helpers/create-fixture.js";
import {
  createAppFixture,
  createFixture,
  js,
} from "./helpers/create-fixture.js";

let fixture: Fixture;
let appFixture: AppFixture;

test.beforeAll(async () => {
  fixture = await createFixture({
    files: {
      "app/routes/_index.tsx": js`
        import { json } from "@remix-run/node";
        import { useLoaderData } from "@remix-run/react";
        export async function loader() {
          const resp = await fetch('https://reqres.in/api/users?page=2');
          return (resp instanceof Response) ? 'is an instance of global Response' : 'is not an instance of global Response';
        }
        export default function Index() {
          let data = useLoaderData();
          return (
            <div>
              {data}
            </div>
          )
        }
      `,
    },
  });

  appFixture = await createAppFixture(fixture);
});

test.afterAll(async () => appFixture.close());

test("returned variable from fetch() should be instance of global Response", async () => {
  let response = await fixture.requestDocument("/");
  expect(await response.text()).toMatch("is an instance of global Response");
});
