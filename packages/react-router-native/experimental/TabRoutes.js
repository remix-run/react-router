import React from "react";
import { Route } from "react-router";
import { View } from "react-native";

import Link from "../Link.js";

export class TabRoutes extends React.PureComponent {
  render() {
    const { children } = this.props;
    return (
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1 }}>{children}</View>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            borderTopWidth: 1,
            borderTopColor: "#ddd",
            backgroundColor: "white"
          }}
        >
          {React.Children.map(children, child => (
            <Route
              path={child.props.path}
              children={({ match }) => (
                <Link to={child.props.path} style={{ flex: 1, padding: 20 }}>
                  {child.props.renderTab({ isActive: !!match })}
                </Link>
              )}
            />
          ))}
        </View>
      </View>
    );
  }
}

export class TabRoute extends React.PureComponent {
  render() {
    const { renderContent, path } = this.props;
    return <Route path={path} render={renderContent} />;
  }
}
