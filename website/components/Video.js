import React from 'react'
import { B, PAD, red, darkGray } from './bricks'

const Video = () => (
  <B background={red} color="white" padding={`${PAD*4}px 0`}>
    <B height="47vw" width="80vw" margin="auto" background={darkGray} boxShadow="0px 10px 30px hsla(0, 0%, 0%, 0.5)">
      {/*<iframe width="100%" height="100%" src="https://www.youtube.com/embed/Vur2dAFZ4GE" frameBorder="0" allowFullScreen></iframe>*/}
    </B>
  </B>
)

export default Video
