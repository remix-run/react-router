import React from "react";
import { MemoryRouter, Route } from "react-router-dom";
import { Block, Col, Row } from "jsxstyle";
import { LIGHT_GRAY, GRAY } from "../Theme";

const LeftArrowIcon = props => (
  <svg
    {...props}
    fill="currentColor"
    viewBox="0 0 40 40"
    preserveAspectRatio="xMidYMid meet"
  >
    <path d="m28.3 18.3h-12.6l3.8-3.8c0.7-0.6 0.7-1.7 0-2.3s-1.7-0.7-2.3 0l-7.9 7.8 7.9 7.8c0.3 0.4 0.7 0.5 1.1 0.5s0.9-0.1 1.2-0.5c0.7-0.6 0.7-1.7 0-2.3l-3.8-3.8h12.6c1 0 1.7-0.8 1.7-1.7s-0.8-1.7-1.7-1.7z" />
  </svg>
);

const RightArrowIcon = props => (
  <svg
    {...props}
    fill="currentColor"
    viewBox="0 0 40 40"
    preserveAspectRatio="xMidYMid meet"
  >
    <path d="m22.2 12.2c-0.7 0.6-0.7 1.7 0 2.3l3.8 3.8h-12.7c-0.9 0-1.6 0.8-1.6 1.7s0.7 1.7 1.6 1.7h12.7l-3.8 3.8c-0.7 0.6-0.7 1.7 0 2.3 0.3 0.4 0.7 0.5 1.1 0.5s0.9-0.1 1.2-0.5l7.9-7.8-7.9-7.8c-0.6-0.7-1.7-0.7-2.3 0z" />
  </svg>
);

const FileCodeIcon = () => (
  <svg
    fill="currentColor"
    height="1em"
    width="1em"
    viewBox="0 0 40 40"
    preserveAspectRatio="xMidYMid meet"
    style={{ verticalAlign: "middle" }}
  >
    <path d="m16.3 15l-6.3 6.3 6.3 6.2 2.5-2.5-3.8-3.7 3.8-3.8-2.5-2.5z m5 2.5l3.7 3.8-3.7 3.7 2.5 2.5 6.2-6.2-6.2-6.3-2.5 2.5z m6.2-15h-22.5v35h30v-27.5l-7.5-7.5z m5 32.5h-25v-30h17.5l7.5 7.5v22.5z" />
  </svg>
);

const Button = ({ children, ...props }) => (
  <Block
    component="button"
    display="inline-block"
    border="none"
    margin="0"
    padding="0"
    background="none"
    fontSize="200%"
    marginTop="-3px"
    props={props}
    children={children}
    outline="none"
    focusColor="hsl(200, 50%, 50%)"
    activeTop="1px"
    activeLeft="1px"
    position={props.disabled ? "" : "relative"}
  />
);

const getUserConfirmation = (message, callback) =>
  callback(window.confirm(message));

const createPath = location => location.pathname + location.search;

class FakeBrowser extends React.Component {
  state = {
    url: null
  };

  render() {
    const { url } = this.state;
    const { children, ...props } = this.props;

    return (
      <MemoryRouter getUserConfirmation={getUserConfirmation}>
        <Route
          render={({ history, location }) => (
            <Col
              className="fake-browser"
              background="white"
              boxShadow="0px 5px 20px hsla(0, 0%, 0%, 0.75)"
              borderRadius="6px"
              {...props}
            >
              <Row
                background="#eee"
                borderTopLeftRadius="6px"
                borderTopRightRadius="6px"
                border="none"
                alignItems="center"
                borderBottom="solid 1px #ccc"
                padding="0 10px"
              >
                <Button onClick={history.goBack} disabled={!history.canGo(-1)}>
                  <LeftArrowIcon
                    height="1em"
                    width="1em"
                    style={{ verticalAlign: "middle", marginTop: -3 }}
                  />
                </Button>
                <Button
                  onClick={history.goForward}
                  disabled={!history.canGo(1)}
                >
                  <RightArrowIcon
                    height="1em"
                    width="1em"
                    style={{ verticalAlign: "middle", marginTop: -3 }}
                  />
                </Button>
                <Block
                  position="relative"
                  zIndex="1"
                  left="8px"
                  top="-2px"
                  color={GRAY}
                >
                  <FileCodeIcon />
                </Block>
                <Row
                  flex="1"
                  alignItems="center"
                  padding="5px"
                  marginLeft="-20px"
                >
                  <Block
                    component="input"
                    font="inherit"
                    width="100%"
                    paddingLeft="25px"
                    color={LIGHT_GRAY}
                    type="text"
                    props={{
                      value: url ? url : createPath(location),
                      onChange: e => {
                        this.setState({ url: e.target.value });
                      },
                      onKeyDown: e => {
                        if (e.key === "Enter") {
                          this.setState({ url: null });
                          history.push(e.target.value);
                        }
                      }
                    }}
                  />
                </Row>
              </Row>
              <Block
                flex="1"
                padding="20px"
                overflow="auto"
                position="relative"
              >
                {React.Children.only(children)}
              </Block>
            </Col>
          )}
        />
      </MemoryRouter>
    );
  }
}

export default FakeBrowser;
