import * as React from "react";
import * as ReactDOM from "react-dom";

let StrictMode: React.FC = function(props) {
  return props.children || (null as any);
};

if (React.StrictMode) {
  StrictMode = React.StrictMode;
}

function renderStrict(
  element:
    | React.FunctionComponentElement<any>
    | React.FunctionComponentElement<any>[],
  node: ReactDOM.Container
): void {
  ReactDOM.render(<StrictMode>{element}</StrictMode>, node);
}

export default renderStrict;
