import * as React from 'react';
import { BackHandler } from 'react-native';
import { act, create as createTestRenderer } from 'react-test-renderer';
import {
  NativeRouter,
  Routes,
  Route,
  Outlet,
  useHardwareBackButton,
  useLocation
} from 'react-router-native';

describe('useAndroidBackButton', () => {
  let backHandlerAddEventListener;
  let backHandlerRemoveEventListener;
  let handleHardwardBackPress;
  let location;
  let testRenderer;

  beforeEach(() => {
    backHandlerAddEventListener = jest
      .spyOn(BackHandler, 'addEventListener')
      .mockImplementation((_, fn) => {
        handleHardwardBackPress = fn;
      });
    backHandlerRemoveEventListener = jest
      .spyOn(BackHandler, 'removeEventListener')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    backHandlerAddEventListener.mockRestore();
    backHandlerRemoveEventListener.mockRestore();
  });

  it('handles hardware back button presses', () => {
    function Layout() {
      location = useLocation();
      useHardwareBackButton();
      return <Outlet />;
    }

    function Home() {
      return <h1>Home</h1>;
    }

    function About() {
      return <h1>About</h1>;
    }

    act(() => {
      testRenderer = createTestRenderer(
        <NativeRouter initialEntries={['/home', '/about']} initialIndex={1}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route path="/home" element={<Home />} />
              <Route path="/about" element={<About />} />
            </Route>
          </Routes>
        </NativeRouter>
      );
    });

    expect(backHandlerAddEventListener).toHaveBeenCalledTimes(1);

    act(() => {
      expect(handleHardwardBackPress()).toEqual(true);
    });

    expect(location.pathname).toBe('/home');

    act(() => {
      expect(handleHardwardBackPress()).toEqual(false);
    });

    act(() => {
      testRenderer.unmount();
    });

    expect(backHandlerRemoveEventListener).toHaveBeenCalledTimes(1);
  });
});
