import React from "react";

let StrictMode = function(props) {
  return props.children || null;
};

if (React.StrictMode) {
  StrictMode = React.StrictMode;
}

export default StrictMode;
