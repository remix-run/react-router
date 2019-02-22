import React from "react";
import { Block } from "jsxstyle";

import Header from "./Header";
import Video from "./Video";
import Footer from "../Footer";

export default function() {
  return (
    <Block>
      <Header />
      <Video />
      <Footer />
    </Block>
  );
}
