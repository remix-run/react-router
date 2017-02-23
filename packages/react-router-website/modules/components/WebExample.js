import React, { PropTypes } from 'react'
import Media from 'react-media'
import { Block } from 'jsxstyle'
import Bundle from './Bundle'
import FakeBrowser from './FakeBrowser'
import SourceViewer from './SourceViewer'

const WebExample = ({ example }) => (
  <Bundle load={example.load}>
    {(Example) => (
      <Bundle load={example.loadSource}>
        {(src) => Example && src ? (
          <Media query="(min-width: 1170px)">
            {(largeScreen) => (
              <Block
                minHeight="100vh"
                background="rgb(45, 45, 45)"
                padding="40px"
              >
                <FakeBrowser
                  key={location.key /*force new instance*/}
                  position={largeScreen ? 'fixed' : 'static'}
                  width={largeScreen ? '400px' : 'auto'}
                  height={largeScreen ? 'auto' : '70vh'}
                  left="290px"
                  top="40px"
                  bottom="40px"
                >
                  <Example/>
                </FakeBrowser>
                <SourceViewer
                  code={src}
                  fontSize="11px"
                  marginLeft={largeScreen ? '440px' : null}
                  marginTop={largeScreen ? null : '40px'}
                />
              </Block>
            )}
          </Media>
        ) : <Block>Loading...</Block>}
      </Bundle>
    )}
  </Bundle>
)

WebExample.propTypes = {
  example: PropTypes.object
}

export default WebExample
