import React from "react";
import Media from "react-media";

import { SMALL_SCREEN } from "../Theme.js";

export default function SmallScreen({ children }) {
  return <Media query={SMALL_SCREEN} children={children} />;
}
