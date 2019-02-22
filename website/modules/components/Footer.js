import React from "react";
import { Block, Inline } from "jsxstyle";

import { DARK_GRAY, BRIGHT_GRAY, LIGHT_GRAY } from "../Theme";
import MailingListSignup from "./MailingListSignup";

function FooterLink({ href, ...rest }) {
  return (
    <Inline
      component="a"
      props={{ href }}
      {...rest}
      textDecoration="underline"
    />
  );
}

function ReactTraining() {
  return (
    <FooterLink href="https://reacttraining.com">React Training</FooterLink>
  );
}

function Contributors() {
  return (
    <FooterLink href="https://github.com/ReactTraining/react-router/graphs/contributors">
      contributors
    </FooterLink>
  );
}

function CC() {
  return (
    <FooterLink href="https://creativecommons.org/licenses/by/4.0/">
      CC 4.0
    </FooterLink>
  );
}

const year = new Date().getFullYear();

function Footer() {
  return (
    <Block>
      <MailingListSignup />
      <Block
        background={DARK_GRAY}
        color={BRIGHT_GRAY}
        padding="40px"
        textAlign="center"
        fontSize="80%"
      >
        <Block component="p">
          React Router is built and maintained by <ReactTraining /> and hundreds
          of <Contributors />.
        </Block>
        <Block marginTop="20px" color={LIGHT_GRAY}>
          &copy; {year} React Training
        </Block>
        <Block color={LIGHT_GRAY}>
          Code examples and documentation <CC />
        </Block>
      </Block>
    </Block>
  );
}

export default Footer;
