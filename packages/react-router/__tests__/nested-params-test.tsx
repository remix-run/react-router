import * as React from "react";
import * as ReactDOM from "react-dom";
import { act } from "react-dom/test-utils";
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  useParams
} from "react-router";

describe("nested routes", () => {
  let node: HTMLDivElement;
  beforeEach(() => {
    node = document.createElement("div");
    document.body.appendChild(node);
  });

  afterEach(() => {
    document.body.removeChild(node);
    node = null!;
  });

  it("gets all params from parent routes", () => {
    function Users() {
      return (
        <div>
          <h1>Users</h1>
          <Outlet />
        </div>
      );
    }

    function User() {
      let { username } = useParams();
      return (
        <div>
          <h1>User: {username}</h1>
          <Routes>
            <Route path="courses" element={<Courses />}>
              <Route path=":courseId" element={<Course />} />
            </Route>
          </Routes>
        </div>
      );
    }

    function Courses() {
      return (
        <div>
          <h1>Courses</h1>
          <Outlet />
        </div>
      );
    }

    function Course() {
      // We should be able to access the username param here even though it was
      // defined in a parent route from another set of <Routes>
      let { username, courseId } = useParams();
      return (
        <div>
          <h1 id="course">
            User: {username}, course {courseId}
          </h1>
        </div>
      );
    }

    act(() => {
      ReactDOM.render(
        <Router initialEntries={["/users/michael/courses/routing"]}>
          <Routes>
            <Route path="users" element={<Users />}>
              <Route path=":username/*" element={<User />} />
            </Route>
          </Routes>
        </Router>,
        node
      );
    });

    let elem = document.querySelector<HTMLHeadingElement>("#course")!;
    expect(elem.innerHTML).toBe("User: michael, course routing");
  });
});
