import { useState, useEffect } from "react";

export default function Bundle({ children, load }) {
  const [mod, setMod] = useState();

  useEffect(() => {
    load(mod => {
      setMod(mod.default ? mod.default : mod);
    });
  }, [load]);

  return children(mod);
}
