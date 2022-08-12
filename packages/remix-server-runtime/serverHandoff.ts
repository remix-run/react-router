import { escapeHtml } from "./markup";

export function createServerHandoffString(serverHandoff: any): string {
  // Uses faster alternative of jsesc to escape data returned from the loaders.
  // This string is inserted directly into the HTML in the `<Scripts>` element.
  return escapeHtml(JSON.stringify(serverHandoff));
}
