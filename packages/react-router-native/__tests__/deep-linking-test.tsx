import * as React from "react";
import { mocked } from "ts-jest/utils";
import { Linking as _Linking, Text, View } from "react-native";
import { act, create as createTestRenderer } from "react-test-renderer";
import {
  NativeRouter,
  Routes,
  Route,
  useDeepLinking
} from "react-router-native";
import { MockEvent, mockPromiseThatResolvesImmediatelyWith } from "./utils";
import type { ReactTestRenderer } from "react-test-renderer";

// Ensures TypeScript understands that Linking is a mock
const Linking = mocked(_Linking);

describe("deep linking", () => {
  describe("when there is no initial URL", () => {
    it("stays on the initial route", () => {
      Linking.getInitialURL.mockImplementation(() => {
        return mockPromiseThatResolvesImmediatelyWith<string>();
      });

      function Home() {
        useDeepLinking();
        return (
          <View>
            <Text>Home</Text>
          </View>
        );
      }

      function About() {
        return (
          <View>
            <Text>About</Text>
          </View>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <NativeRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </NativeRouter>
        );
      });

      expect(renderer.toJSON()).toMatchSnapshot();

      Linking.getInitialURL.mockRestore();
    });
  });

  describe("when there is an initial URL", () => {
    it("navigates to the matching route", () => {
      Linking.getInitialURL.mockImplementation(() => {
        return mockPromiseThatResolvesImmediatelyWith("app:///about");
      });

      function Home() {
        useDeepLinking();
        return (
          <View>
            <Text>Home</Text>
          </View>
        );
      }

      function About() {
        return (
          <View>
            <Text>About</Text>
          </View>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <NativeRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </NativeRouter>
        );
      });

      expect(renderer!.toJSON()).toMatchSnapshot();

      Linking.getInitialURL.mockRestore();
    });
  });

  describe('when a "url" event happens', () => {
    it("navigates to the matching route", () => {
      Linking.getInitialURL.mockImplementation(() => {
        return mockPromiseThatResolvesImmediatelyWith<string>();
      });

      let listeners: Array<(...args: any[]) => any> = [];
      Linking.addEventListener.mockImplementation((type, listener) => {
        if (type !== "url") throw new Error(`Invalid event type: ${type}`);
        listeners.push(listener);
      });

      function changeURL(url: string) {
        let event = new MockEvent("url", { url });
        listeners.forEach(listener => listener(event));
      }

      function Home() {
        useDeepLinking();
        return (
          <View>
            <Text>Home</Text>
          </View>
        );
      }

      function About() {
        return (
          <View>
            <Text>About</Text>
          </View>
        );
      }

      let renderer!: ReactTestRenderer;
      act(() => {
        renderer = createTestRenderer(
          <NativeRouter initialEntries={["/home"]}>
            <Routes>
              <Route path="home" element={<Home />} />
              <Route path="about" element={<About />} />
            </Routes>
          </NativeRouter>
        );
      });

      expect(renderer.toJSON()).toMatchSnapshot();

      act(() => {
        changeURL("app:///about");
      });

      expect(renderer.toJSON()).toMatchSnapshot();

      Linking.addEventListener.mockRestore();
      Linking.getInitialURL.mockRestore();
    });
  });
});
