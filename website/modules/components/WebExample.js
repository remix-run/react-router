import React from "react";
import { Route } from "react-router-dom";
import Media from "react-media";
import { Block } from "jsxstyle";
import PropTypes from "prop-types";

import Bundle from "./Bundle";
import FakeBrowser from "./FakeBrowser";
import SourceViewer from "./SourceViewer";
import Loading from "./Loading";

function WebExample({ example }) {
  return (
    <Bundle load={example.load}>
      {Example => (
        <Bundle load={example.loadSource}>
          {src =>
            Example && src ? (
              <Media query="(min-width: 1170px)">
                {largeScreen => (
                  <Block
                    minHeight="100vh"
                    background="rgb(45, 45, 45)"
                    padding="40px"
                  >
                    <Route
                      render={({ location }) => (
                        <FakeBrowser
                          key={location.key /*force new instance*/}
                          position={largeScreen ? "fixed" : "static"}
                          width={largeScreen ? "400px" : "auto"}
                          height={largeScreen ? "auto" : "70vh"}
                          left="290px"
                          top="40px"
                          bottom="40px"
                        >
                          <Example />
                        </FakeBrowser>
                      )}
                    />
                    <SourceViewer
                      code={src}
                      fontSize="11px"
                      marginLeft={largeScreen ? "440px" : null}
                      marginTop={largeScreen ? null : "40px"}
                    />
                  </Block>
                )}
              </Media>
            ) : (
              <Loading />
            )
          }
        </Bundle>
      )}
    </Bundle>
  );
}

WebExample.propTypes = {
  example: PropTypes.object
};

export default WebExample;
