import React from "react";
import { Link, Route } from "react-router-dom";
import { Block, Row, Inline, Col } from "jsxstyle";
import PropTypes from "prop-types";
import Media from "react-media";

import { LIGHT_GRAY, RED, SMALL_SCREEN } from "../Theme";
import Logo from "./Logo";

function Tab({ to, ...rest }) {
  return (
    <Route
      path={to}
      children={({ match }) => (
        <Block
          component={Link}
          props={{ to }}
          flex="1"
          textAlign="center"
          textTransform="uppercase"
          fontWeight="bold"
          fontSize="90%"
          padding="5px"
          background={match ? RED : "white"}
          color={match ? "white" : ""}
          {...rest}
        />
      )}
    />
  );
}

Tab.propTypes = { to: PropTypes.string };

function Tabs() {
  return (
    <Row boxShadow="0px 1px 1px hsla(0, 0%, 0%, 0.15)" margin="10px">
      <Tab to="/web" borderTopLeftRadius="3px" borderBottomLeftRadius="3px">
        Web
      </Tab>
      <Tab to="/native" marginLeft="-1px">
        Native
      </Tab>
      <Tab
        to="/core"
        marginLeft="-1px"
        borderTopRightRadius="3px"
        borderBottomRightRadius="3px"
      >
        Core
      </Tab>
    </Row>
  );
}

function Branding() {
  return (
    <Col alignItems="center" padding="15px 0">
      <Logo size={36} shadow={false} />
      <Block
        marginTop="10px"
        flex="1"
        textTransform="uppercase"
        fontWeight="bold"
        fontSize="90%"
      >
        <Inline component="a" props={{ href: "https://reacttraining.com" }}>
          React Training
        </Inline>
        <Inline> / </Inline>
        <Inline
          component="a"
          props={{ href: "https://github.com/ReactTraining/react-router" }}
          color={LIGHT_GRAY}
        >
          React Router
        </Inline>
      </Block>
    </Col>
  );
}

function EnvironmentHeader() {
  return (
    <Block>
      <Media query={SMALL_SCREEN}>
        <Block
          padding="1px"
          backgroundColor={RED}
          textAlign="center"
          color="#fff"
        >
          <p>
            <a
              href="https://reacttraining.com"
              style={{ textDecoration: "underline" }}
            >
              Attend a React Workshop
            </a>{" "}
            in a city near you this Spring!
          </p>
        </Block>
      </Media>
      <Branding />
      <Tabs />
    </Block>
  );
}

export default EnvironmentHeader;
