import React, { Component } from "react";
import PropTypes from "prop-types";
import WebExample from "./WebExample";
import NativeExample from "./NativeExample";
import { Redirect } from "react-router-dom";

class Example extends Component {
  static propTypes = {
    data: PropTypes.object,
    match: PropTypes.shape({
      params: PropTypes.shape({
        example: PropTypes.string,
        environment: PropTypes.string
      })
    })
  };

  render() {
    const {
      data,
      match: {
        params: { example: exampleParam, environment }
      }
    } = this.props;
    const example = data.examples.find(e => e.slug === exampleParam);
    const isNative = environment === "native";
    return example ? (
      isNative ? (
        <NativeExample example={example} />
      ) : (
        <WebExample example={example} />
      )
    ) : (
      <Redirect to={`/${environment}/example/${data.examples[0].slug}`} />
    );
  }
}

export default Example;
