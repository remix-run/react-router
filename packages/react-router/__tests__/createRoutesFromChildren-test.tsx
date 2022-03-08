import * as React from "react";
import { Route, createRoutesFromChildren } from "react-router";

describe("creating routes from JSX", () => {
  it("creates a route config of nested JavaScript objects", () => {
    expect(
      createRoutesFromChildren(
        <Route path="/">
          <Route path="home" element={<h1>home</h1>} />
          <Route path="about" element={<h1>about</h1>} />
          <Route path="users">
            <Route index element={<h1>users index</h1>} />
            <Route path=":id" element={<h1>user profile</h1>} />
          </Route>
        </Route>
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "caseSensitive": undefined,
          "children": Array [
            Object {
              "caseSensitive": undefined,
              "element": <h1>
                home
              </h1>,
              "id": "0-0",
              "index": undefined,
              "path": "home",
            },
            Object {
              "caseSensitive": undefined,
              "element": <h1>
                about
              </h1>,
              "id": "0-1",
              "index": undefined,
              "path": "about",
            },
            Object {
              "caseSensitive": undefined,
              "children": Array [
                Object {
                  "caseSensitive": undefined,
                  "element": <h1>
                    users index
                  </h1>,
                  "id": "0-2-0",
                  "index": true,
                  "path": undefined,
                },
                Object {
                  "caseSensitive": undefined,
                  "element": <h1>
                    user profile
                  </h1>,
                  "id": "0-2-1",
                  "index": undefined,
                  "path": ":id",
                },
              ],
              "element": undefined,
              "id": "0-2",
              "index": undefined,
              "path": "users",
            },
          ],
          "element": undefined,
          "id": "0",
          "index": undefined,
          "path": "/",
        },
      ]
    `);
  });
});
