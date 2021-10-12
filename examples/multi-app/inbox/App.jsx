import { Routes, Route } from "react-router-dom";
import { Layout } from "../shared/layout";
import { NoMatch } from "../shared/no-match";
import "../shared/index.css";
import { messages } from "./messages";

export default function InboxApp() {
  return (
    <Routes>
      <Route path="/" element={<Layout app="Inbox" />}>
        <Route index element={<Inbox />} />
        <Route path="*" element={<NoMatch />} />
      </Route>
    </Routes>
  );
}

function Inbox() {
  return (
    <div>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {messages.map(message => (
          <div
            key={message.id}
            style={{
              display: "flex",
              borderBottom: "1px solid #ccc",
              padding: "10px",
              width: "100%"
            }}
          >
            <span
              style={{
                flexBasis: 100,
                marginRight: "1rem"
              }}
            >
              {message.from.name}
            </span>
            <div
              style={{
                flexGrow: 1,
                textOverflow: "ellipsis",
                width: "100%",
                whiteSpace: "nowrap",
                overflow: "hidden",
                marginRight: "1rem"
              }}
            >
              <span>{message.subject}</span>
              <span>{message.body}</span>
            </div>
            <span style={{ flexShrink: 0 }}>
              {new Date(message.date).toDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
