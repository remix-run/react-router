// TODO: Replace with React.createContext once we can assume React 16+
import createContext from "create-react-context";

const createNamedContext = name => {
  const context = createContext();
  context.Provider.displayName = `${name}.Provider`;
  context.Consumer.displayName = `${name}.Consumer`;
  return context;
}

const context = /*#__PURE__*/ createNamedContext('Router');
export default context;
