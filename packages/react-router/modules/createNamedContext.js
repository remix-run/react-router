// TODO: Replace with React.createContext once we can assume React 16+
import createContext from "./createContext";

const createNamedContext = name => {
  const context = createContext();
  context.displayName = name;

  return context;
};

export default createNamedContext;
