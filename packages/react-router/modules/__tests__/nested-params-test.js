import React from 'react';
import { create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter as Router,
  Outlet,
  Routes,
  Route,
  useParams
} from 'react-router';

describe('nested routes', () => {
  it('gets all params from parent routes', () => {
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
      // We should be able to access the username param here
      // even though it was defined in a parent route from
      // another set of <Routes>
      let { username, courseId } = useParams();
      return (
        <div>
          <h1>
            User: {username}, course {courseId}
          </h1>
        </div>
      );
    }

    let renderer = createTestRenderer(
      <Router initialEntries={['/users/michael/courses/routing']}>
        <Routes>
          <Route path="users" element={<Users />}>
            <Route path=":username/*" element={<User />} />
          </Route>
        </Routes>
      </Router>
    );

    expect(renderer.toJSON()).not.toBeNull();
    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
