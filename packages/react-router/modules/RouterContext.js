import React from "react";
import createReactContext from "create-react-context";

const RouterContext = React.createContext
  ? React.createContext({})
  : createReactContext({});

export default RouterContext;
