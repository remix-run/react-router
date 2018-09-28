// TODO: Replace with React.createContext once we can assume React 16+
import createContext from "create-react-context";

const context = createContext();

context.Provider.displayName = "Router.Provider";
context.Consumer.displayName = "Router.Consumer";

export default context;
