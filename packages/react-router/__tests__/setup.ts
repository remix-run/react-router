import {
  ReadableStream,
  TextDecoderStream,
  TextEncoderStream,
  TransformStream,
  WritableStream,
} from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

// https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

if (!globalThis.TextEncoder || !globalThis.TextDecoder) {
  globalThis.TextEncoder = TextEncoder;
  globalThis.TextDecoder = TextDecoder;
}

if (!globalThis.ReadableStream || !globalThis.WritableStream) {
  globalThis.ReadableStream = ReadableStream;
  globalThis.WritableStream = WritableStream;
}

type SubmitterElement = HTMLButtonElement | HTMLInputElement;

function isSubmitterElement(
  element: Element | null,
): element is SubmitterElement {
  return (
    element instanceof HTMLButtonElement ||
    (element instanceof HTMLInputElement &&
      (element.type === "submit" || element.type === "image"))
  );
}

function getSubmitterElement(target: EventTarget | null) {
  let element =
    target instanceof Element ? target.closest("button, input") : null;
  return isSubmitterElement(element) ? element : null;
}

if (
  typeof window !== "undefined" &&
  window.FormData &&
  globalThis.FormData !== window.FormData
) {
  globalThis.FormData = window.FormData;
}

if (typeof document !== "undefined" && globalThis.FormData) {
  let activeSubmitter: SubmitterElement | null = null;
  let imageInputCoords = new WeakMap<
    SubmitterElement,
    { x: string; y: string }
  >();
  let NativeFormData = globalThis.FormData;

  let cloneControl = (element: Element) => {
    let clone = element.cloneNode(true) as Element;

    if (
      element instanceof HTMLInputElement &&
      clone instanceof HTMLInputElement
    ) {
      clone.checked = element.checked;
      clone.value = element.value;
    } else if (
      element instanceof HTMLTextAreaElement &&
      clone instanceof HTMLTextAreaElement
    ) {
      clone.value = element.value;
    } else if (
      element instanceof HTMLSelectElement &&
      clone instanceof HTMLSelectElement
    ) {
      Array.from(element.options).forEach((option, index) => {
        clone.options[index].selected = option.selected;
      });
    }

    return clone;
  };

  let getControlEntries = (element: Element) => {
    let form = document.createElement("form");
    form.appendChild(cloneControl(element));
    return Array.from(new NativeFormData(form).entries());
  };

  let getSubmitterEntries = (
    submitter: SubmitterElement,
  ): Array<[string, FormDataEntryValue]> => {
    if (submitter instanceof HTMLInputElement && submitter.type === "image") {
      let coords = imageInputCoords.get(submitter) ?? { x: "0", y: "0" };
      let prefix = submitter.name ? `${submitter.name}.` : "";
      return [
        [`${prefix}x`, coords.x],
        [`${prefix}y`, coords.y],
      ];
    }

    return submitter.name ? [[submitter.name, submitter.value]] : [];
  };

  let supportsFormDataSubmitter = () => {
    let form = document.createElement("form");
    form.innerHTML = `
      <input name="a" value="1" />
      <button name="b" value="2"></button>
      <input name="c" value="3" />
    `;
    let submitter = form.querySelector("button");
    if (!(submitter instanceof HTMLButtonElement)) {
      return false;
    }

    try {
      return (
        JSON.stringify(
          Array.from(new NativeFormData(form, submitter).entries()),
        ) ===
        JSON.stringify([
          ["a", "1"],
          ["b", "2"],
          ["c", "3"],
        ])
      );
    } catch {
      return false;
    }
  };

  if (!supportsFormDataSubmitter()) {
    class FormDataWithSubmitter extends NativeFormData {
      constructor(form?: HTMLFormElement, submitter?: SubmitterElement) {
        if (submitter !== undefined && !isSubmitterElement(submitter)) {
          throw new TypeError("Invalid submitter");
        }

        if (
          form instanceof HTMLFormElement &&
          submitter &&
          isSubmitterElement(submitter)
        ) {
          super();
          let elements = Array.from(form.elements).filter(
            (element): element is Element => element instanceof Element,
          );
          if (
            !elements.some(
              (element) =>
                element === submitter || element.isSameNode(submitter),
            )
          ) {
            let index = elements.findIndex((element) =>
              Boolean(
                submitter.compareDocumentPosition(element) &
                  Node.DOCUMENT_POSITION_FOLLOWING,
              ),
            );
            if (index >= 0) {
              elements.splice(index, 0, submitter);
            } else {
              elements.push(submitter);
            }
          }

          for (let element of elements) {
            if (!(element instanceof Element)) continue;
            if (element === submitter || element.isSameNode(submitter)) {
              for (let [key, value] of getSubmitterEntries(submitter)) {
                this.append(key, value);
              }
              continue;
            }
            for (let [key, value] of getControlEntries(element)) {
              this.append(key, value);
            }
          }
          return;
        }

        if (form instanceof HTMLFormElement) {
          super(form);
          return;
        }

        super();
      }
    }

    globalThis.FormData = FormDataWithSubmitter as typeof FormData;
    window.FormData = globalThis.FormData;
  }

  let supportsImageInputSubmit = () => {
    let form = document.createElement("form");
    let input = document.createElement("input");
    input.type = "image";
    form.appendChild(input);

    let submitCount = 0;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      submitCount += 1;
    });

    input.click();
    return submitCount > 0;
  };

  // JSDOM submit events don't currently expose `SubmitEvent.submitter`.
  document.addEventListener(
    "click",
    (event) => {
      activeSubmitter = getSubmitterElement(event.target);
      if (
        activeSubmitter instanceof HTMLInputElement &&
        activeSubmitter.type === "image"
      ) {
        imageInputCoords.set(activeSubmitter, {
          x: String(event.clientX),
          y: String(event.clientY),
        });
      }
    },
    true,
  );
  if (!supportsImageInputSubmit()) {
    document.addEventListener("click", (event) => {
      let submitter = getSubmitterElement(event.target);
      if (
        !event.defaultPrevented &&
        submitter instanceof HTMLInputElement &&
        submitter.type === "image" &&
        submitter.form
      ) {
        submitter.form.requestSubmit(submitter);
      }
    });
  }
  document.addEventListener(
    "submit",
    (event) => {
      if (!("submitter" in event)) {
        Object.defineProperty(event, "submitter", {
          configurable: true,
          value:
            event.target instanceof HTMLFormElement &&
            activeSubmitter?.form === event.target
              ? activeSubmitter
              : null,
        });
      }
      activeSubmitter = null;
    },
    true,
  );
}

if (!globalThis.fetch) {
  let {
    fetch: undiciFetch,
    FormData: UndiciFormData,
    Headers: UndiciHeaders,
    Request: UndiciRequest,
    Response: UndiciResponse,
  } = await import("undici");

  globalThis.fetch = undiciFetch;
  globalThis.Request = UndiciRequest;
  globalThis.Response = UndiciResponse;
  globalThis.Headers = UndiciHeaders;

  globalThis.FormData = globalThis.FormData || UndiciFormData;
}

if (!globalThis.TextEncoderStream) {
  globalThis.TextEncoderStream = TextEncoderStream;
}

if (!globalThis.TextDecoderStream) {
  globalThis.TextDecoderStream = TextDecoderStream;
}

if (!globalThis.TransformStream) {
  globalThis.TransformStream = TransformStream;
}

const consoleError = console.error;
console.error = (msg, ...args) => {
  if (
    typeof msg === "string" &&
    msg.includes("react-test-renderer is deprecated")
  ) {
    return;
  }
  consoleError.call(console, msg, ...args);
};
