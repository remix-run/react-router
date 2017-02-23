import React from 'react'
import { Block } from 'jsxstyle'
import { DARK_GRAY } from '../../Theme'

const Video = () => (
  <Block
    background={DARK_GRAY}
    color="white"
    padding="80px 0"
  >
    <Block
      height="45vw"
      width="80vw"
      margin="auto"
      background={DARK_GRAY}
      boxShadow="0px 10px 30px hsla(0, 0%, 0%, 0.5)"
    >
      <iframe
        width="100%"
        height="100%"
        src="https://www.youtube.com/embed/a4kqMQorcnE"
        frameBorder="0"
        allowFullScreen={true}
      />
    </Block>
  </Block>
)

export default Video
