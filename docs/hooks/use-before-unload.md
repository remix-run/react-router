---
title: useBeforeUnload
new: true
---

# `useBeforeUnload`

This hook is just a helper around `window.onbeforeunload`. It can be useful to save important application state on the page (to something like the browser's local storage), before the user navigates away from your page. That way if they come back you can restore any stateful information (restore form input values, etc.)

```tsx lines=[1,7-11]
import { useBeforeUnload } from "react-router-dom";

function SomeForm() {
  const [state, setState] = React.useState(null);

  // save it off before users navigate away
  useBeforeUnload(
    React.useCallback(() => {
      localStorage.stuff = state;
    }, [state])
  );

  // read it in when they return
  React.useEffect(() => {
    if (state === null && localStorage.stuff != null) {
      setState(localStorage.stuff);
    }
  }, [state]);

  return <>{/*... */}</>;
}
```
