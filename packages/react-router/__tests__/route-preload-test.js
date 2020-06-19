import React from 'react';
import { act, create as createTestRenderer } from 'react-test-renderer';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Outlet,
  useParams
} from 'react-router';

describe('route.preload', () => {
  it('is called when the route matches', () => {
    function Profile() {
      return (
        <div>
          <h1>Profile</h1>
          <Outlet />
        </div>
      );
    }

    function ProfileUser() {
      let { username } = useParams();
      return (
        <div>
          <h1>User: {username}</h1>
          <Outlet />
        </div>
      );
    }

    function ProfileUserPhotos() {
      return (
        <div>
          <h1>Photos</h1>
        </div>
      );
    }

    function ProfileUserContacts() {
      return (
        <div>
          <h1>Photos</h1>
        </div>
      );
    }

    let preloadProfile = jest.fn();
    let preloadUser = jest.fn();
    let preloadPhotos = jest.fn();
    let preloadContacts = jest.fn();

    act(() => {
      createTestRenderer(
        <Router initialEntries={['/profile/mjackson/photos']}>
          <Routes>
            <Route
              path="profile"
              element={<Profile />}
              preload={preloadProfile}
            >
              <Route
                path=":username"
                element={<ProfileUser />}
                preload={preloadUser}
              >
                <Route
                  path="photos"
                  element={<ProfileUserPhotos />}
                  preload={preloadPhotos}
                />
                <Route
                  path="contacts"
                  element={<ProfileUserContacts />}
                  preload={preloadContacts}
                />
              </Route>
            </Route>
          </Routes>
        </Router>
      );
    });

    expect(preloadProfile).toHaveBeenCalled();
    expect(preloadProfile).toHaveBeenCalledWith(
      expect.not.objectContaining({
        username: 'mjackson'
      }),
      expect.objectContaining({
        pathname: '/profile/mjackson/photos'
      }),
      0
    );

    expect(preloadUser).toHaveBeenCalled();
    expect(preloadUser).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'mjackson'
      }),
      expect.objectContaining({
        pathname: '/profile/mjackson/photos'
      }),
      1
    );

    expect(preloadPhotos).toHaveBeenCalled();
    expect(preloadPhotos).toHaveBeenCalledWith(
      expect.objectContaining({
        username: 'mjackson'
      }),
      expect.objectContaining({
        pathname: '/profile/mjackson/photos'
      }),
      2
    );

    expect(preloadContacts).not.toHaveBeenCalled();
  });
});
