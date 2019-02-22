import React from "react";
import Media from "react-media";

import { SMALL_SCREEN } from "../Theme";

function SmallScreen({ children }) {
  return <Media query={SMALL_SCREEN} children={children} />;
}

export default SmallScreen;
