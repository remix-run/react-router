"use client";

import { useState } from "react";

export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h3>
        Counter: {count}{" "}
        <button type="button" onClick={() => setCount(count + 1)}>
          Increment
        </button>
      </h3>
    </div>
  );
}
