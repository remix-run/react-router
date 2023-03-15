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
      [
        {
          "Component": undefined,
          "ErrorBoundary": undefined,
          "action": undefined,
          "caseSensitive": undefined,
          "children": [
            {
              "Component": undefined,
              "ErrorBoundary": undefined,
              "action": undefined,
              "caseSensitive": undefined,
              "element": <h1>
                home
              </h1>,
              "errorElement": undefined,
              "handle": undefined,
              "hasErrorBoundary": false,
              "id": "0-0",
              "index": undefined,
              "lazy": undefined,
              "loader": undefined,
              "path": "home",
              "shouldRevalidate": undefined,
            },
            {
              "Component": undefined,
              "ErrorBoundary": undefined,
              "action": undefined,
              "caseSensitive": undefined,
              "element": <h1>
                about
              </h1>,
              "errorElement": undefined,
              "handle": undefined,
              "hasErrorBoundary": false,
              "id": "0-1",
              "index": undefined,
              "lazy": undefined,
              "loader": undefined,
              "path": "about",
              "shouldRevalidate": undefined,
            },
            {
              "Component": undefined,
              "ErrorBoundary": undefined,
              "action": undefined,
              "caseSensitive": undefined,
              "children": [
                {
                  "Component": undefined,
                  "ErrorBoundary": undefined,
                  "action": undefined,
                  "caseSensitive": undefined,
                  "element": <h1>
                    users index
                  </h1>,
                  "errorElement": undefined,
                  "handle": undefined,
                  "hasErrorBoundary": false,
                  "id": "0-2-0",
                  "index": true,
                  "lazy": undefined,
                  "loader": undefined,
                  "path": undefined,
                  "shouldRevalidate": undefined,
                },
                {
                  "Component": undefined,
                  "ErrorBoundary": undefined,
                  "action": undefined,
                  "caseSensitive": undefined,
                  "element": <h1>
                    user profile
                  </h1>,
                  "errorElement": undefined,
                  "handle": undefined,
                  "hasErrorBoundary": false,
                  "id": "0-2-1",
                  "index": undefined,
                  "lazy": undefined,
                  "loader": undefined,
                  "path": ":id",
                  "shouldRevalidate": undefined,
                },
              ],
              "element": undefined,
              "errorElement": undefined,
              "handle": undefined,
              "hasErrorBoundary": false,
              "id": "0-2",
              "index": undefined,
              "lazy": undefined,
              "loader": undefined,
              "path": "users",
              "shouldRevalidate": undefined,
            },
          ],
          "element": undefined,
          "errorElement": undefined,
          "handle": undefined,
          "hasErrorBoundary": false,
          "id": "0",
          "index": undefined,
          "lazy": undefined,
          "loader": undefined,
          "path": "/",
          "shouldRevalidate": undefined,
        },
      ]
    `);
  });

  it("creates a data-aware route config of nested JavaScript objects", () => {
    expect(
      createRoutesFromChildren(
        <Route errorElement={<h1>💥</h1>} path="/">
          <Route
            path="home"
            loader={async () => {}}
            shouldRevalidate={() => true}
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
      [
        {
          "Component": undefined,
          "ErrorBoundary": undefined,
          "action": undefined,
          "caseSensitive": undefined,
          "children": [
            {
              "Component": undefined,
              "ErrorBoundary": undefined,
              "action": undefined,
              "caseSensitive": undefined,
              "element": <h1>
                home
              </h1>,
              "errorElement": undefined,
              "handle": undefined,
              "hasErrorBoundary": false,
              "id": "0-0",
              "index": undefined,
              "lazy": undefined,
              "loader": [Function],
              "path": "home",
              "shouldRevalidate": [Function],
            },
            {
              "Component": undefined,
              "ErrorBoundary": undefined,
              "action": undefined,
              "caseSensitive": undefined,
              "children": [
                {
                  "Component": undefined,
                  "ErrorBoundary": undefined,
                  "action": [Function],
                  "caseSensitive": undefined,
                  "element": <h1>
                    users index
                  </h1>,
                  "errorElement": undefined,
                  "handle": undefined,
                  "hasErrorBoundary": false,
                  "id": "0-1-0",
                  "index": true,
                  "lazy": undefined,
                  "loader": undefined,
                  "path": undefined,
                  "shouldRevalidate": undefined,
                },
              ],
              "element": undefined,
              "errorElement": undefined,
              "handle": undefined,
              "hasErrorBoundary": false,
              "id": "0-1",
              "index": undefined,
              "lazy": undefined,
              "loader": undefined,
              "path": "users",
              "shouldRevalidate": undefined,
            },
          ],
          "element": undefined,
          "errorElement": <h1>
            💥
          </h1>,
          "handle": undefined,
          "hasErrorBoundary": true,
          "id": "0",
          "index": undefined,
          "lazy": undefined,
          "loader": undefined,
          "path": "/",
          "shouldRevalidate": undefined,
        },
      ]
    `);
  });

  it("throws when the index route has children", () => {
    expect(() => {
      createRoutesFromChildren(
        <Route path="/">
          {/* @ts-expect-error */}
          <Route index>
            <Route path="users" />
          </Route>
        </Route>
      );
    }).toThrow("An index route cannot have child routes.");
  });

  it("supports react fragments for automatic ID generation", () => {
    expect(
      createRoutesFromChildren(
        <Route path="/">
          <Route index />
          <>
            <Route path="a">
              <>
                <Route path="1" />
                <Route path="2" />
              </>
            </Route>
            <Route path="b" />
          </>
        </Route>
      )
    ).toEqual([
      {
        id: "0",
        path: "/",
        hasErrorBoundary: false,
        children: [
          {
            id: "0-0",
            index: true,
            hasErrorBoundary: false,
          },
          {
            id: "0-1-0",
            path: "a",
            hasErrorBoundary: false,
            children: [
              {
                id: "0-1-0-0-0",
                path: "1",
                hasErrorBoundary: false,
              },
              {
                id: "0-1-0-0-1",
                path: "2",
                hasErrorBoundary: false,
              },
            ],
          },
          {
            id: "0-1-1",
            path: "b",
            hasErrorBoundary: false,
          },
        ],
      },
    ]);
  });
});
