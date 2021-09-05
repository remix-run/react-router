import React from "react";
import { TouchableHighlight } from "react-native";
import PropTypes from "prop-types";

import { __HistoryContext as HistoryContext } from "react-router";

export default class Link extends React.Component {
  static defaultProps = {
    component: TouchableHighlight,
    replace: false
  };

  handlePress = (event, history) => {
    if (this.props.onPress) this.props.onPress(event);

    if (!event.defaultPrevented) {
      const { to, replace } = this.props;

      if (replace) {
        history.replace(to);
      } else {
        history.push(to);
      }
    }
  };

  render() {
    const { component: Component, to, replace, ...rest } = this.props;

    return (
      <HistoryContext.Consumer>
        {history => (
          <Component
            {...rest}
            onPress={event => this.handlePress(event, history)}
          />
        )}
      </HistoryContext.Consumer>
    );
  }
}

const __DEV__ = true; // TODO

if (__DEV__) {
  Link.propTypes = {
    onPress: PropTypes.func,
    component: PropTypes.elementType,
    replace: PropTypes.bool,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
  };
}
