import { ViewTransition } from "react";

export function Square() {
  const top = Math.random() * 100;
  const left = Math.random() * 100;

  return (
    <ViewTransition name="red-square">
      <div
        style={{
          position: "relative",
          height: "200px",
          width: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: `${top}%`,
            left: `${left}%`,
            height: "50px",
            width: "50px",
            backgroundColor: "red",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
    </ViewTransition>
  );
}
