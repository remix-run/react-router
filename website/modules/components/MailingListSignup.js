import React, { Component } from "react";
import PropTypes from "prop-types";
import { Block, Flex } from "jsxstyle";

import subscribeToMailingList from "../utils/subscribeToMailingList";
import { RED } from "../Theme";
import SmallScreen from "./SmallScreen";

const Button = ({ children, ...props }) => (
  <Block
    component="button"
    color="#fff"
    padding="15px 10px"
    background={RED}
    borderRadius={0}
    cursor="pointer"
    border="none"
    textShadow="none"
    minWidth="80px"
    children={children}
    {...props}
  />
);

Button.propTypes = {
  children: PropTypes.node
};

const Input = ({ margin, ...props }) => (
  <Block
    component="input"
    padding="10px 8px"
    border="1px solid #d6d6d6"
    borderRadius="0"
    backgroundColor="white"
    height="42px"
    flex="1"
    props={props}
    margin={margin}
  />
);

Input.propTypes = {
  margin: PropTypes.any
};

class MailingListSignup extends Component {
  state = { email: "", submitted: false };

  handleSubmit = e => {
    e.preventDefault();

    if (this.state.email) {
      subscribeToMailingList(this.state.email).then(() => {
        this.setState({ email: "", submitted: true });
      });
    }
  };

  render() {
    const { email, submitted } = this.state;

    return (
      <SmallScreen>
        {isSmallScreen => (
          <Block
            background="white"
            maxWidth="700px"
            margin="auto"
            padding={isSmallScreen ? "40px" : "80px"}
          >
            {submitted ? (
              <Block textAlign="center">
                <p>Thanks! You've been added to the list.</p>
                <p style={{ marginTop: 10 }}>
                  <a
                    style={{ textDecoration: "underline", cursor: "pointer" }}
                    onClick={() => this.setState({ submitted: false })}
                  >
                    Reset
                  </a>
                </p>
              </Block>
            ) : (
              <div>
                <Block
                  margin="auto"
                  paddingBottom={isSmallScreen ? "20px" : "40px"}
                  textAlign="center"
                  fontSize={isSmallScreen ? "100%" : "150%"}
                  fontWeight="bold"
                >
                  Sign up to receive updates about React Router,{" "}
                  <a
                    href="https://reacttraining.com"
                    style={{ textDecoration: "underline" }}
                  >
                    our React workshops
                  </a>, and more:
                </Block>
                <form onSubmit={this.handleSubmit}>
                  <Flex
                    flexDirection={isSmallScreen ? "column" : "row"}
                    justifyContent="space-around"
                  >
                    <Input
                      value={email}
                      onChange={e => this.setState({ email: e.target.value })}
                      type="email"
                      name="email"
                      placeholder="you@email.com"
                      margin={isSmallScreen ? "0 0 5px 0" : "0 5px 0 0"}
                    />
                    <Button type="submit">Subscribe</Button>
                  </Flex>
                </form>
              </div>
            )}
          </Block>
        )}
      </SmallScreen>
    );
  }
}

export default MailingListSignup;
