import { generateHTML as defaultGenerateHTML } from "@react-router/dev/config/default-rsc-entries/entry.ssr";

export function generateHTML(request: Request, serverResponse: Response) {
  console.log("custom entry.ssr");

  return defaultGenerateHTML(request, serverResponse);
}
