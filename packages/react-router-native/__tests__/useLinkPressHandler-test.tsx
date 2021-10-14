import * as React from "react";
import { Text, TouchableHighlight, View } from "react-native";
import type { LinkProps } from "react-router-native";
import {
  NativeRouter,
  Route,
  Routes,
  useLinkPressHandler
} from "react-router-native";
import type { ReactTestRenderer } from "react-test-renderer";
import { act, create as createTestRenderer } from "react-test-renderer";

import { press } from "./utils";

describe("Custom link with useLinkPressHandler", () => {
  function Link({ to, replace, state, ...rest }: LinkProps) {
    let handlePress = useLinkPressHandler(to, { replace, state });
    return <TouchableHighlight {...rest} onPress={handlePress} />;
  }
  it("navigates to the new view", () => {
    function Home() {
      return (
        <View>
          <Text>Home</Text>
          <Link to="../about">
            <Text>About</Text>
          </Link>
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

    let touchable = renderer.root.findByType(TouchableHighlight);
    expect(touchable).not.toBeNull();

    act(() => {
      press(touchable);
    });

    expect(renderer.toJSON()).toMatchSnapshot();
  });
});
