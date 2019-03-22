import React, { Component } from "react";
import PropTypes from "prop-types";
import { Block, InlineBlock } from "jsxstyle";
import { Link, Route, Redirect, Switch } from "react-router-dom";

import { LIGHT_GRAY, RED } from "../Theme";
import EnvironmentHeader from "./EnvironmentHeader";
import Example from "./Example";
import Guide from "./Guide";
import API from "./API";

class EnvironmentLarge extends Component {
  static propTypes = {
    data: PropTypes.object,
    match: PropTypes.object
  };

  componentDidMount() {
    this.preloadExamples();
  }

  preloadExamples() {
    const { data } = this.props;
    data.examples.forEach(example => {
      // native doesn't have `load`
      if (example.load) example.load(() => {});
      // all have `loadSource`
      if (example.loadSource) example.loadSource(() => {});
    });
  }

  render() {
    const { data, match } = this.props;
    return (
      <Block>
        <Nav data={data} environment={match.params.environment} />
        <Content data={data} match={match} />
      </Block>
    );
  }
}

function Title(props) {
  return (
    <Block
      textTransform="uppercase"
      fontWeight="bold"
      color={LIGHT_GRAY}
      marginTop="20px"
      {...props}
    />
  );
}

function Triangle({ color }) {
  return (
    <InlineBlock
      position="absolute"
      right="-10px"
      width="0"
      height="0"
      borderTop="10px solid transparent"
      borderBottom="10px solid transparent"
      borderRight={`10px solid ${color}`}
    />
  );
}

Triangle.propTypes = { color: PropTypes.string };

function NavLink({ children, to, color, triangleColor }) {
  return (
    <Route
      path={to}
      children={({ match }) => (
        <Block
          component={Link}
          hoverTextDecoration="underline"
          color={match ? RED : color}
          position="relative"
          props={{ to }}
        >
          {children}
          {match && <Triangle color={triangleColor} />}
        </Block>
      )}
    />
  );
}

NavLink.propTypes = {
  children: PropTypes.string,
  to: PropTypes.string,
  color: PropTypes.string,
  triangleColor: PropTypes.string
};

function NavLinks({ data, environment }) {
  return (
    <Block lineHeight="1.8" padding="10px">
      {Array.isArray(data.examples) &&
        data.examples.length > 0 && (
          <Block>
            <Title>Examples</Title>
            <Block paddingLeft="10px">
              {data.examples.map((item, i) => (
                <NavLink
                  key={i}
                  to={`/${environment}/example/${item.slug}`}
                  triangleColor="rgb(45, 45, 45)"
                  children={item.label}
                />
              ))}
            </Block>
          </Block>
        )}

      <Title>Guides</Title>
      <Block paddingLeft="10px">
        {data.guides &&
          data.guides.map((item, i) => (
            <NavLink
              key={i}
              to={`/${environment}/guides/${item.title.slug}`}
              triangleColor="white"
              children={item.title.text}
            />
          ))}
      </Block>

      <Title>API</Title>
      <Block paddingLeft="10px" fontFamily="Monaco, monospace">
        {data.api.map((item, i) => (
          <Block key={i} marginBottom="10px">
            <NavLink
              key={i}
              to={`/${environment}/api/${item.title.slug}`}
              triangleColor="white"
              children={item.title.text}
            />
            <Block paddingLeft="10px" fontSize="90%">
              {item.headers.map((header, i) => (
                <NavLink
                  key={i}
                  to={`/${environment}/api/${item.title.slug}/${header.slug}`}
                  triangleColor="white"
                  children={header.text}
                  color={LIGHT_GRAY}
                />
              ))}
            </Block>
          </Block>
        ))}
      </Block>
    </Block>
  );
}

NavLinks.propTypes = {
  data: PropTypes.object,
  environment: PropTypes.string
};

function Nav({ data, environment }) {
  return (
    <Block
      fontSize="13px"
      background="#eee"
      overflow="auto"
      position="fixed"
      height="100vh"
      left="0"
      top="0"
      bottom="0"
      width="250px"
    >
      <EnvironmentHeader />
      <NavLinks data={data} environment={environment} />
    </Block>
  );
}

Nav.propTypes = {
  data: PropTypes.object,
  environment: PropTypes.string
};

function Content({ data, match }) {
  return (
    <Block marginLeft="250px">
      <Switch>
        <Route
          path={`${match.path}/api/:mod?/:header?`}
          render={props => (
            <API key={props.match.params.environment} {...props} data={data} />
          )}
        />
        <Route
          path={`${match.path}/example/:example`}
          render={props => <Example {...props} data={data} />}
        />
        <Route
          path={`${match.path}/guides/:mod/:header?`}
          render={props => <Guide {...props} data={data} />}
        />
        <Route
          exact
          path={match.url}
          render={() => (
            <Redirect to={`${match.url}/guides/${data.guides[0].title.slug}`} />
          )}
        />
        <Redirect to={match.url} />
      </Switch>
    </Block>
  );
}

Content.propTypes = {
  data: PropTypes.object,
  match: PropTypes.object
};

export default EnvironmentLarge;
