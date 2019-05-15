import { useState, useEffect } from "react";

function Bundle({ children, load }) {
  const [mod, setMod] = useState();

  useEffect(
    () => {
      load(mod => {
        setMod(mod.default ? mod.default : mod);
      });
    },
    [load]
  );

  return children(mod);
}

export default Bundle;
