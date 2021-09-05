import React from "react";
import { Block } from "jsxstyle";

import Footer from "../Footer.js";
import Header from "./Header.js";
import Video from "./Video.js";

export default function() {
  return (
    <Block>
      <Header />
      <Video />
      <Footer />
    </Block>
  );
}
