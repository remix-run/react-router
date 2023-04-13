import type {
  FormEncType,
  HTMLFormMethod,
  RelativeRoutingType,
} from "@remix-run/router";
import { stripBasename } from "@remix-run/router";

export const defaultMethod: HTMLFormMethod = "get";
const defaultEncType: FormEncType = "application/x-www-form-urlencoded";

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
  defaultSearchParams: URLSearchParams | null
) {
  let searchParams = createSearchParams(locationSearch);

  if (defaultSearchParams) {
    for (let key of defaultSearchParams.keys()) {
      if (!searchParams.has(key)) {
        defaultSearchParams.getAll(key).forEach((value) => {
          searchParams.append(key, value);
        });
      }
    }
  }

  return searchParams;
}

export type SubmitTarget =
  | HTMLFormElement
  | HTMLButtonElement
  | HTMLInputElement
  | FormData
  | URLSearchParams
  | { [name: string]: string }
  | NonNullable<unknown> // Raw payload submissions
  | null;

export interface SubmitOptions {
  /**
   * The HTTP method used to submit the form. Overrides `<form method>`.
   * Defaults to "GET".
   */
  method?: HTMLFormMethod;

  /**
   * The action URL path used to submit the form. Overrides `<form action>`.
   * Defaults to the path of the current route.
   */
  action?: string;

  /**
   * The action URL used to submit the form. Overrides `<form encType>`.
   * Defaults to "application/x-www-form-urlencoded".  Specifying `null` will
   * opt-out of serialization and will submit the data directly to your action
   * in the `payload` parameter.
   *
   * In v7, the default behavior will change from "application/x-www-form-urlencoded"
   * to `null` and will make serialization opt-in
   */
  encType?: FormEncType | null;

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

  /**
   * In browser-based environments, prevent resetting scroll after this
   * navigation when using the <ScrollRestoration> component
   */
  preventScrollReset?: boolean;
}

export function getFormSubmissionInfo(
  target: SubmitTarget,
  options: SubmitOptions,
  basename: string
): {
  action: string | null;
  method: string;
  encType: string | null;
  formData: FormData | undefined;
  payload: any;
} {
  let method: string;
  let action: string | null = null;
  let encType: string | null;
  let formData: FormData | undefined = undefined;
  let payload: unknown = undefined;

  if (isFormElement(target)) {
    let submissionTrigger: HTMLButtonElement | HTMLInputElement = (
      options as any
    ).submissionTrigger;

    if (options.action) {
      action = options.action;
    } else {
      // When grabbing the action from the element, it will have had the basename
      // prefixed to ensure non-JS scenarios work, so strip it since we'll
      // re-prefix in the router
      let attr = target.getAttribute("action");
      action = attr ? stripBasename(attr, basename) : null;
    }
    method = options.method || target.getAttribute("method") || defaultMethod;
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

    if (options.action) {
      action = options.action;
    } else {
      // When grabbing the action from the element, it will have had the basename
      // prefixed to ensure non-JS scenarios work, so strip it since we'll
      // re-prefix in the router
      let attr =
        target.getAttribute("formaction") || form.getAttribute("action");
      action = attr ? stripBasename(attr, basename) : null;
    }

    method =
      options.method ||
      target.getAttribute("formmethod") ||
      form.getAttribute("method") ||
      defaultMethod;
    encType =
      options.encType ||
      target.getAttribute("formenctype") ||
      form.getAttribute("enctype") ||
      defaultEncType;

    formData = new FormData(form);

    // Include name + value from a <button>, appending in case the button name
    // matches an existing input name
    if (target.name) {
      formData.append(target.name, target.value);
    }
  } else if (isHtmlElement(target)) {
    throw new Error(
      `Cannot submit element that is not <form>, <button>, or ` +
        `<input type="submit|image">`
    );
  } else if (options.encType === null) {
    method = options.method || defaultMethod;
    action = options.action || null;
    encType = null;
    payload = target;
  } else {
    method = options.method || defaultMethod;
    action = options.action || null;
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
          // @ts-expect-error
          formData.append(name, target[name]);
        }
      }
    }
  }

  return { action, method: method.toLowerCase(), encType, formData, payload };
}
