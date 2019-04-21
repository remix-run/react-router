import React from "react";

const createNamedContext = name => {
  const context = React.createContext();
  context.displayName = name;

  return context;
};

const context = /*#__PURE__*/ createNamedContext("Router");
export default context;
