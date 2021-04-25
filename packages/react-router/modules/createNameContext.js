// TODO: Replace with React.createContext once we can assume React 16+
// DONE: Polyfill for the React context API 补充版，兼容 react < 16
import createContext from "mini-create-react-context";

const createNamedContext = name => {
  const context = createContext();
  context.displayName = name;

  return context;
};

export default createNamedContext;