import { createContext } from "react";

const createNamedContext = name => {
  const context = createContext();
  context.displayName = name;

  return context;
};

export default createNamedContext;
