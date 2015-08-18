import invariant from 'invariant';
import React, {
  Component,
  PropTypes,
  createElement,
  isValidElement
} from 'react';
import * as RouterPropTypes from './PropTypes';
import renderComponents from './renderComponents';
import { pick, inArray } from './CollectionUtils';

const dontPass = [
  'createElement'
];

export default class RouterRenderer extends Component {
  static propTypes = {
    // Router state
    routes: RouterPropTypes.routes.isRequired,
    params: PropTypes.object.isRequired,
    location: RouterPropTypes.location.isRequired,
    components: PropTypes.array.isRequired,

    // Extra
    createElement: PropTypes.func
  }

  static defaultProps = {
    createElement
  }

  createElement = (component, props) => {
    return component ? this.props.createElement(component, props) : null;
  }

  render() {
    const element = renderComponents(
      this.props,
      pick(this.props, key => !inArray(dontPass)),
      this.createElement
    );

    invariant(
      element === null || element === false || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }
}
