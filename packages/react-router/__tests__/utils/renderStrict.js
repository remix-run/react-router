import * as React from "react";
import * as ReactDOM from "react-dom";

let StrictMode = function (props) {
  return props.children || null;
};

if (React.StrictMode) {
  StrictMode = React.StrictMode;
}

function renderStrict(element, node) {
  ReactDOM.render(<StrictMode>{element}</StrictMode>, node);
}

export default renderStrict;
