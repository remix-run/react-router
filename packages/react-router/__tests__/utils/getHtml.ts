import { prettyDOM } from "@testing-library/react";

export default function getHtml(container: HTMLElement) {
  return prettyDOM(container, undefined, {
    highlight: false,
  });
}
