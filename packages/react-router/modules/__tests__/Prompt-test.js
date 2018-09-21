import React from "react";
import ReactDOM from "react-dom";
import MemoryRouter from "../MemoryRouter";
import Prompt from "../Prompt";

describe("A <Prompt>", () => {
  it("is enabled when 'when' is undefined", () => {
    const node = document.createElement("div");

    spyOn(Prompt.prototype, "enable");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Prompt message="hi" />
      </MemoryRouter>,
      node
    );

    expect(Prompt.prototype.enable).toHaveBeenCalledTimes(1);
    expect(Prompt.prototype.enable).toHaveBeenCalledWith("hi");
  });

  it("is enabled when 'when' is true", () => {
    const node = document.createElement("div");

    spyOn(Prompt.prototype, "enable");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Prompt when message="hi" />
      </MemoryRouter>,
      node
    );

    expect(Prompt.prototype.enable).toHaveBeenCalledTimes(1);
    expect(Prompt.prototype.enable).toHaveBeenCalledWith("hi");
  });

  it("is not enabled when 'when' is false", () => {
    const node = document.createElement("div");

    spyOn(Prompt.prototype, "enable");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <Prompt when={false} message="hi" />
      </MemoryRouter>,
      node
    );

    expect(Prompt.prototype.enable).toHaveBeenCalledTimes(0);
  });

  it("does not error in StrictMode", () => {
    const node = document.createElement("div");

    spyOn(console, "error");

    ReactDOM.render(
      <MemoryRouter initialEntries={["/one"]}>
        <React.StrictMode>
          <Prompt when={false} message="hi" />
        </React.StrictMode>
      </MemoryRouter>,
      node
    );

    expect(console.error).toHaveBeenCalledTimes(0);
  });
});
