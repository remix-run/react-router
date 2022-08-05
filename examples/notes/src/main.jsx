import "./index.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { DataBrowserRouter, Route } from "react-router-dom";

import Root, { loader as rootLoader } from "./routes/root";
import NewNote, { action as newNoteAction } from "./routes/new";
import Note, {
  loader as noteLoader,
  action as noteAction,
} from "./routes/note";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <DataBrowserRouter>
      <Route path="/" element={<Root />} loader={rootLoader}>
        <Route path="new" element={<NewNote />} action={newNoteAction} />
        <Route
          path="note/:noteId"
          element={<Note />}
          loader={noteLoader}
          action={noteAction}
          errorElement={<h2>Note not found</h2>}
        />
      </Route>
    </DataBrowserRouter>
  </React.StrictMode>
);
