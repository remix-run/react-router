import type { FormEncType, FormMethod } from "@remix-run/router";
import type { RelativeRoutingType } from "react-router";

export const defaultMethod = "get";
const defaultEncType = "application/x-www-form-urlencoded";

export function isHtmlElement(object: any): object is HTMLElement {
  return object != null && typeof object.tagName === "string";
}

export function isButtonElement(object: any): object is HTMLButtonElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}

export function isFormElement(object: any): object is HTMLFormElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}

export function isInputElement(object: any): object is HTMLInputElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}

function isSelectElement(object: any): object is HTMLSelectElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "select";
}

function isTextareaElement(object: any): object is HTMLTextAreaElement {
  return isHtmlElement(object) && object.tagName.toLowerCase() === "textarea";
}

export function isImageInputElement(
  object: any
): object is HTMLImageInputElement {
  return isInputElement(object) && object.type === "image";
}

export const SELECTED_COORDINATE = Symbol();
interface HTMLImageInputElement extends HTMLInputElement {
  type: "image";
  // track the selected coordinate of an image button, since FormData can't do this (yet); see buildFormData
  [SELECTED_COORDINATE]?: { x: number; y: number };
}
// we only ever need one of these on the page, and we don't want it to go away
if (typeof document !== "undefined") {
  document.body.addEventListener(
    "click",
    (e) => {
      if (isImageInputElement(e.target)) {
        e.target[SELECTED_COORDINATE] = {
          x: e.offsetX,
          y: e.offsetY,
        };
      }
    },
    { capture: true }
  );
}

type LimitedMouseEvent = Pick<
  MouseEvent,
  "button" | "metaKey" | "altKey" | "ctrlKey" | "shiftKey"
>;

function isModifiedEvent(event: LimitedMouseEvent) {
  return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}

export function shouldProcessLinkClick(
  event: LimitedMouseEvent,
  target?: string
) {
  return (
    event.button === 0 && // Ignore everything but left clicks
    (!target || target === "_self") && // Let browser handle "target=_blank" etc.
    !isModifiedEvent(event) // Ignore clicks with modifier keys
  );
}

export type ParamKeyValuePair = [string, string];

export type URLSearchParamsInit =
  | string
  | ParamKeyValuePair[]
  | Record<string, string | string[]>
  | URLSearchParams;

/**
 * Creates a URLSearchParams object using the given initializer.
 *
 * This is identical to `new URLSearchParams(init)` except it also
 * supports arrays as values in the object form of the initializer
 * instead of just strings. This is convenient when you need multiple
 * values for a given key, but don't want to use an array initializer.
 *
 * For example, instead of:
 *
 *   let searchParams = new URLSearchParams([
 *     ['sort', 'name'],
 *     ['sort', 'price']
 *   ]);
 *
 * you can do:
 *
 *   let searchParams = createSearchParams({
 *     sort: ['name', 'price']
 *   });
 */
export function createSearchParams(
  init: URLSearchParamsInit = ""
): URLSearchParams {
  return new URLSearchParams(
    typeof init === "string" ||
    Array.isArray(init) ||
    init instanceof URLSearchParams
      ? init
      : Object.keys(init).reduce((memo, key) => {
          let value = init[key];
          return memo.concat(
            Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]
          );
        }, [] as ParamKeyValuePair[])
  );
}

export function getSearchParamsForLocation(
  locationSearch: string,
  defaultSearchParams: URLSearchParams
) {
  let searchParams = createSearchParams(locationSearch);

  for (let key of defaultSearchParams.keys()) {
    if (!searchParams.has(key)) {
      defaultSearchParams.getAll(key).forEach((value) => {
        searchParams.append(key, value);
      });
    }
  }

  return searchParams;
}

export interface SubmitOptions {
  /**
   * The HTTP method used to submit the form. Overrides `<form method>`.
   * Defaults to "GET".
   */
  method?: FormMethod;

  /**
   * The action URL path used to submit the form. Overrides `<form action>`.
   * Defaults to the path of the current route.
   *
   * Note: It is assumed the path is already resolved. If you need to resolve a
   * relative path, use `useFormAction`.
   */
  action?: string;

  /**
   * The action URL used to submit the form. Overrides `<form encType>`.
   * Defaults to "application/x-www-form-urlencoded".
   */
  encType?: FormEncType;

  /**
   * Set `true` to replace the current entry in the browser's history stack
   * instead of creating a new one (i.e. stay on "the same page"). Defaults
   * to `false`.
   */
  replace?: boolean;

  /**
   * Determines whether the form action is relative to the route hierarchy or
   * the pathname.  Use this if you want to opt out of navigating the route
   * hierarchy and want to instead route based on /-delimited URL segments
   */
  relative?: RelativeRoutingType;
}

export function getFormSubmissionInfo(
  target:
    | HTMLFormElement
    | HTMLButtonElement
    | HTMLInputElement
    | FormData
    | URLSearchParams
    | { [name: string]: string }
    | null,
  defaultAction: string,
  options: SubmitOptions
): {
  url: URL;
  method: string;
  encType: string;
  formData: FormData;
} {
  let method: string;
  let action: string;
  let encType: string;
  let formData: FormData;

  if (isFormElement(target)) {
    let submissionTrigger: HTMLButtonElement | HTMLInputElement = (
      options as any
    ).submissionTrigger;

    method = options.method || target.getAttribute("method") || defaultMethod;
    action = options.action || target.getAttribute("action") || defaultAction;
    encType =
      options.encType || target.getAttribute("enctype") || defaultEncType;

    formData = new FormData(target);

    if (submissionTrigger && submissionTrigger.name) {
      formData.append(submissionTrigger.name, submissionTrigger.value);
    }
  } else if (
    isButtonElement(target) ||
    (isInputElement(target) &&
      (target.type === "submit" || target.type === "image"))
  ) {
    let form = target.form;

    if (form == null) {
      throw new Error(
        `Cannot submit a <button> or <input type="submit"> without a <form>`
      );
    }

    // <button>/<input type="submit"> may override attributes of <form>

    method =
      options.method ||
      target.getAttribute("formmethod") ||
      form.getAttribute("method") ||
      defaultMethod;
    action =
      options.action ||
      target.getAttribute("formaction") ||
      form.getAttribute("action") ||
      defaultAction;
    encType =
      options.encType ||
      target.getAttribute("formenctype") ||
      form.getAttribute("enctype") ||
      defaultEncType;

    formData = buildFormData(form, target);
  } else if (isHtmlElement(target)) {
    throw new Error(
      `Cannot submit element that is not <form>, <button>, or ` +
        `<input type="submit|image">`
    );
  } else {
    method = options.method || defaultMethod;
    action = options.action || defaultAction;
    encType = options.encType || defaultEncType;

    if (target instanceof FormData) {
      formData = target;
    } else {
      formData = new FormData();

      if (target instanceof URLSearchParams) {
        for (let [name, value] of target) {
          formData.append(name, value);
        }
      } else if (target != null) {
        for (let name of Object.keys(target)) {
          formData.append(name, target[name]);
        }
      }
    }
  }

  let { protocol, host } = window.location;
  let url = new URL(action, `${protocol}//${host}`);

  return { url, method: method.toLowerCase(), encType, formData };
}

/**
 * Build the form data set
 *
 * FormData doesn't (yet) have a submitter-aware constructor -- see https://github.com/whatwg/xhr/issues/262
 *
 * In the meantime, we can follow the HTML spec and build the data set ourselves:
 * https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-form-data-set
 *
 * Notes:
 *  - we return a FormData object rather than an entry list of tuples
 *  - we skip a few things in the spec that are deprecated/unimplemented/untenable (see inline
 *    IMPLEMENTATION NOTES)
 */
function buildFormData(
  form: HTMLFormElement,
  submitter: HTMLButtonElement | HTMLInputElement
) {
  // 1. If form's constructing entry list is true, then return null.
  // 2. Set form's constructing entry list to true.
  // 3. Let controls be a list of all the submittable elements whose form owner is form, in tree order.
  let submittable = ":is(button,input,select,textarea)";
  type SubmittableElement =
    | HTMLButtonElement
    | HTMLInputElement
    | HTMLSelectElement
    | HTMLTextAreaElement;

  let scope: HTMLElement | Document = form;
  let ownedByForm = `${submittable}:not([form], :scope form *)`;
  if (form.id) {
    scope = document;
    ownedByForm = `${submittable}[form='${form.id}'],#${form.id} ${submittable}:not([form], #${form.id} form *)`;
  }
  let controls = scope.querySelectorAll<SubmittableElement>(ownedByForm);

  // 4. Let entry list be a new empty entry list.
  let entryList: [string, string | File][] = [];

  // 5. For each element field in controls, in tree order:
  for (let field of controls) {
    //  1. If any of the following is true:
    //      - The field element has a datalist element ancestor.
    //      - The field element is disabled.
    //      - The field element is a button but it is not submitter.
    //      - The field element is an input element whose type attribute is in the Checkbox state and whose checkedness is false.
    //      - The field element is an input element whose type attribute is in the Radio Button state and whose checkedness is false.
    //     Then continue.
    //
    // IMPLEMENTATION NOTES:
    //  - We skip the datalist check since 1. browsers don't do it and 2. the only valid child of a datalist
    //    is an option, which is not a submittable element.
    //  - "button" is defined in the spec as any element with the prose "The element is a button"
    //    See: https://html.spec.whatwg.org/multipage/input.html
    //     and https://html.spec.whatwg.org/multipage/form-elements.html
    if (field.matches(":disabled")) continue;
    let isButton =
      isButtonElement(field) ||
      (isInputElement(field) &&
        ["submit", "image", "button", "reset"].includes(field.type));
    if (isButton && field !== submitter) continue;
    if (field.matches("input[type~='radio checkbox']:not([checked])")) continue;

    //  2. If the field element is an input element whose type attribute is in the Image Button state, then:
    //     1. If the field element has a name attribute specified and its value is not the empty string, let name be that value followed by a single U+002E FULL STOP character (.). Otherwise, let name be the empty string.
    //     2. Let namex be the string consisting of the concatenation of name and a single U+0078 LATIN SMALL LETTER X character (x).
    //     3. Let namey be the string consisting of the concatenation of name and a single U+0079 LATIN SMALL LETTER Y character (y).
    //     4. The field element is submitter, and before this algorithm was invoked the user indicated a coordinate. Let x be the x-component of the coordinate selected by the user, and let y be the y-component of the coordinate selected by the user.
    //     5. Create an entry with namex and x, and append it to entry list.
    //     6. Create an entry with namey and y, and append it to entry list.
    //     7. Continue.
    if (
      isImageInputElement(field) &&
      field === submitter &&
      field[SELECTED_COORDINATE]
    ) {
      let prefix = field.name ? `${field.name}.` : "";
      let { x, y } = field[SELECTED_COORDINATE];
      entryList.push([`${prefix}x`, String(x)]);
      entryList.push([`${prefix}y`, String(y)]);
      continue;
    }

    //  3. If the field is a form-associated custom element, then perform the entry construction algorithm given field and entry list, then continue.
    //
    // IMPLEMENTATION NOTES:
    // Not implemented, because:
    //  - Only Chrome, Edge and recent Firefox fully support form-associated custom elements: https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals/setFormValue#browser_compatibility
    //  - Form-associated custom elements in React feels a bit edge-casey 🤷‍♂️
    //  - There's no efficient way to get the registered tag names of form-associated custom elements, making it hard to populate them in our controls list
    //  - There's no reliable way to get at an element's ElementInternals, meaning we can't reliably get its form entry(ies)

    //  4. If either the field element does not have a name attribute specified, or its name attribute's value is the empty string, then continue.
    //  5. Let name be the value of the field element's name attribute.
    let { name } = field;
    if (!name) continue;

    //  6. If the field element is a select element, then for each option element in the select element's list of options whose selectedness is true and that is not disabled, create an entry with name and the value of the option element, and append it to entry list.
    if (isSelectElement(field)) {
      for (let option of field.selectedOptions) {
        if (!option.disabled) entryList.push([name, option.value]);
      }
    }
    //  7. Otherwise, if the field element is an input element whose type attribute is in the Checkbox state or the Radio Button state, then:
    //     1. If the field element has a value attribute specified, then let value be the value of that attribute; otherwise, let value be the string "on".
    //     2. Create an entry with name and value, and append it to entry list.
    else if (
      isInputElement(field) &&
      ["radio", "checkbox"].includes(field.type)
    ) {
      if (field.checked) entryList.push([name, field.value]);
    }
    //  8. Otherwise, if the field element is an input element whose type attribute is in the File Upload state, then:
    //     1. If there are no selected files, then create an entry with name and a new File object with an empty name, application/octet-stream as type, and an empty body, and append it to entry list.
    //     2. Otherwise, for each file in selected files, create an entry with name and a File object representing the file, and append it to entry list.
    else if (isInputElement(field) && field.type === "file") {
      if (field.files?.length) {
        for (let file of field.files) {
          entryList.push([name, file]);
        }
      } else {
        entryList.push([name, ""]);
      }
    }
    //  9. Otherwise, if the field element is an input element whose type attribute is in the Hidden state and name is an ASCII case-insensitive match for "_charset_":
    //     1. Let charset be the name of encoding if encoding is given, and "UTF-8" otherwise.
    //     2. Create an entry with name and charset, and append it to entry list.
    else if (
      isInputElement(field) &&
      field.type === "hidden" &&
      field.name.toLowerCase() === "_charset_"
    ) {
      // IMPLEMENTATION NOTES:
      //  - UTF-8 is the standard, but we might consider supporting other legacy encodings, see
      //    https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#selecting-a-form-submission-encoding
      //    https://encoding.spec.whatwg.org/#concept-encoding-get
      entryList.push([name, "UTF-8"]);
    }

    //  10. Otherwise, create an entry with name and the value of the field element, and append it to entry list.
    else {
      entryList.push([name, field.value]);
    }

    //  11. If the element has a dirname attribute, and that attribute's value is not the empty string, then:
    //      1. Let dirname be the value of the element's dirname attribute.
    //      2. Let dir be the string "ltr" if the directionality of the element is 'ltr', and "rtl" otherwise (i.e., when the directionality of the element is 'rtl').
    //      3. Create an entry with dirname and dir, and append it to entry list.
    if (isInputElement(field) || isTextareaElement(field)) {
      if (field.dirName) {
        entryList.push([
          field.dirName,
          getComputedStyle(field).getPropertyValue("direction"),
        ]);
      }
    }
  }
  // 6. Let form data be a new FormData object associated with entry list.
  // 7. Fire an event named formdata at form using FormDataEvent, with the formData attribute initialized to form data and the bubbles attribute initialized to true.
  // 8. Set form's constructing entry list to false.
  // 9. Return a clone of entry list.
  //
  // IMPLEMENTATION NOTES:
  //  - We return FormData rather than an entry list
  //  - We don't fire the formdata event; the browser will do that for us, though unfortunately it's before we've populated it :-/
  let formData = new FormData();
  for (let [name, value] of entryList) formData.append(name, value);
  return formData;
}
