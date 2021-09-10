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
              "element": <Route
                element={
                  <h1>
                    home
                  </h1>
                }
                path="home"
              />,
              "index": undefined,
              "path": "home",
            },
            Object {
              "caseSensitive": undefined,
              "element": <Route
                element={
                  <h1>
                    about
                  </h1>
                }
                path="about"
              />,
              "index": undefined,
              "path": "about",
            },
            Object {
              "caseSensitive": undefined,
              "children": Array [
                Object {
                  "caseSensitive": undefined,
                  "element": <Route
                    element={
                      <h1>
                        users index
                      </h1>
                    }
                    index={true}
                  />,
                  "index": true,
                  "path": undefined,
                },
                Object {
                  "caseSensitive": undefined,
                  "element": <Route
                    element={
                      <h1>
                        user profile
                      </h1>
                    }
                    path=":id"
                  />,
                  "index": undefined,
                  "path": ":id",
                },
              ],
              "element": <Route
                path="users"
              >
                <Route
                  element={
                    <h1>
                      users index
                    </h1>
                  }
                  index={true}
                />
                <Route
                  element={
                    <h1>
                      user profile
                    </h1>
                  }
                  path=":id"
                />
              </Route>,
              "index": undefined,
              "path": "users",
            },
          ],
          "element": <Route
            path="/"
          >
            <Route
              element={
                <h1>
                  home
                </h1>
              }
              path="home"
            />
            <Route
              element={
                <h1>
                  about
                </h1>
              }
              path="about"
            />
            <Route
              path="users"
            >
              <Route
                element={
                  <h1>
                    users index
                  </h1>
                }
                index={true}
              />
              <Route
                element={
                  <h1>
                    user profile
                  </h1>
                }
                path=":id"
              />
            </Route>
          </Route>,
          "index": undefined,
          "path": "/",
        },
      ]
    `);
  });
});
