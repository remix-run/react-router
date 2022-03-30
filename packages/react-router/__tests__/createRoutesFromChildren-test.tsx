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
          "action": undefined,
          "caseSensitive": undefined,
          "children": Array [
            Object {
              "action": undefined,
              "caseSensitive": undefined,
              "element": <h1>
                home
              </h1>,
              "exceptionElement": undefined,
              "id": "0-0",
              "index": undefined,
              "loader": undefined,
              "path": "home",
              "shouldReload": undefined,
            },
            Object {
              "action": undefined,
              "caseSensitive": undefined,
              "element": <h1>
                about
              </h1>,
              "exceptionElement": undefined,
              "id": "0-1",
              "index": undefined,
              "loader": undefined,
              "path": "about",
              "shouldReload": undefined,
            },
            Object {
              "action": undefined,
              "caseSensitive": undefined,
              "children": Array [
                Object {
                  "action": undefined,
                  "caseSensitive": undefined,
                  "element": <h1>
                    users index
                  </h1>,
                  "exceptionElement": undefined,
                  "id": "0-2-0",
                  "index": true,
                  "loader": undefined,
                  "path": undefined,
                  "shouldReload": undefined,
                },
                Object {
                  "action": undefined,
                  "caseSensitive": undefined,
                  "element": <h1>
                    user profile
                  </h1>,
                  "exceptionElement": undefined,
                  "id": "0-2-1",
                  "index": undefined,
                  "loader": undefined,
                  "path": ":id",
                  "shouldReload": undefined,
                },
              ],
              "element": undefined,
              "exceptionElement": undefined,
              "id": "0-2",
              "index": undefined,
              "loader": undefined,
              "path": "users",
              "shouldReload": undefined,
            },
          ],
          "element": undefined,
          "exceptionElement": undefined,
          "id": "0",
          "index": undefined,
          "loader": undefined,
          "path": "/",
          "shouldReload": undefined,
        },
      ]
    `);
  });

  it("creates a data-aware route config of nested JavaScript objects", () => {
    expect(
      createRoutesFromChildren(
        <Route exceptionElement={<h1>💥</h1>} path="/">
          <Route
            path="home"
            loader={async () => {}}
            shouldReload={() => true}
            element={<h1>home</h1>}
          />
          <Route path="users">
            <Route
              index
              action={async () => {}}
              element={<h1>users index</h1>}
            />
          </Route>
        </Route>
      )
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "action": undefined,
          "caseSensitive": undefined,
          "children": Array [
            Object {
              "action": undefined,
              "caseSensitive": undefined,
              "element": <h1>
                home
              </h1>,
              "exceptionElement": undefined,
              "id": "0-0",
              "index": undefined,
              "loader": [Function],
              "path": "home",
              "shouldReload": [Function],
            },
            Object {
              "action": undefined,
              "caseSensitive": undefined,
              "children": Array [
                Object {
                  "action": [Function],
                  "caseSensitive": undefined,
                  "element": <h1>
                    users index
                  </h1>,
                  "exceptionElement": undefined,
                  "id": "0-1-0",
                  "index": true,
                  "loader": undefined,
                  "path": undefined,
                  "shouldReload": undefined,
                },
              ],
              "element": undefined,
              "exceptionElement": undefined,
              "id": "0-1",
              "index": undefined,
              "loader": undefined,
              "path": "users",
              "shouldReload": undefined,
            },
          ],
          "element": undefined,
          "exceptionElement": <h1>
            💥
          </h1>,
          "id": "0",
          "index": undefined,
          "loader": undefined,
          "path": "/",
          "shouldReload": undefined,
        },
      ]
    `);
  });
});
