/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
import { warning } from "../router/history.js";
import { stripBasename } from "../router/utils.js";
const defaultEncType = "application/x-www-form-urlencoded";
function isHtmlElement(object) {
	return typeof HTMLElement !== "undefined" && object instanceof HTMLElement;
}
function isButtonElement(object) {
	return isHtmlElement(object) && object.tagName.toLowerCase() === "button";
}
function isFormElement(object) {
	return isHtmlElement(object) && object.tagName.toLowerCase() === "form";
}
function isInputElement(object) {
	return isHtmlElement(object) && object.tagName.toLowerCase() === "input";
}
function isModifiedEvent(event) {
	return !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
}
function shouldProcessLinkClick(event, target) {
	return event.button === 0 && (!target || target === "_self") && !isModifiedEvent(event);
}
/**
Creates a URLSearchParams object using the given initializer.

This is identical to `new URLSearchParams(init)` except it also
supports arrays as values in the object form of the initializer
instead of just strings. This is convenient when you need multiple
values for a given key, but don't want to use an array initializer.

For example, instead of:

```tsx
let searchParams = new URLSearchParams([
['sort', 'name'],
['sort', 'price']
]);
```
you can do:

```
let searchParams = createSearchParams({
sort: ['name', 'price']
});
```

@category Utils
*/
function createSearchParams(init = "") {
	return new URLSearchParams(typeof init === "string" || Array.isArray(init) || init instanceof URLSearchParams ? init : Object.keys(init).reduce((memo, key) => {
		let value = init[key];
		return memo.concat(Array.isArray(value) ? value.map((v) => [key, v]) : [[key, value]]);
	}, []));
}
function getSearchParamsForLocation(locationSearch, defaultSearchParams) {
	let searchParams = createSearchParams(locationSearch);
	if (defaultSearchParams) defaultSearchParams.forEach((_, key) => {
		if (!searchParams.has(key)) defaultSearchParams.getAll(key).forEach((value) => {
			searchParams.append(key, value);
		});
	});
	return searchParams;
}
let _formDataSupportsSubmitter = null;
function isFormDataSubmitterSupported() {
	if (_formDataSupportsSubmitter === null) try {
		new FormData(document.createElement("form"), 0);
		_formDataSupportsSubmitter = false;
	} catch (e) {
		_formDataSupportsSubmitter = true;
	}
	return _formDataSupportsSubmitter;
}
const supportedFormEncTypes = new Set([
	"application/x-www-form-urlencoded",
	"multipart/form-data",
	"text/plain"
]);
function getFormEncType(encType) {
	if (encType != null && !supportedFormEncTypes.has(encType)) {
		warning(false, `"${encType}" is not a valid \`encType\` for \`<Form>\`/\`<fetcher.Form>\` and will default to "${defaultEncType}"`);
		return null;
	}
	return encType;
}
function getFormSubmissionInfo(target, basename) {
	let method;
	let action;
	let encType;
	let formData;
	let body;
	if (isFormElement(target)) {
		let attr = target.getAttribute("action");
		action = attr ? stripBasename(attr, basename) : null;
		method = target.getAttribute("method") || "get";
		encType = getFormEncType(target.getAttribute("enctype")) || defaultEncType;
		formData = new FormData(target);
	} else if (isButtonElement(target) || isInputElement(target) && (target.type === "submit" || target.type === "image")) {
		let form = target.form;
		if (form == null) throw new Error(`Cannot submit a <button> or <input type="submit"> without a <form>`);
		let attr = target.getAttribute("formaction") || form.getAttribute("action");
		action = attr ? stripBasename(attr, basename) : null;
		method = target.getAttribute("formmethod") || form.getAttribute("method") || "get";
		encType = getFormEncType(target.getAttribute("formenctype")) || getFormEncType(form.getAttribute("enctype")) || defaultEncType;
		formData = new FormData(form, target);
		if (!isFormDataSubmitterSupported()) {
			let { name, type, value } = target;
			if (type === "image") {
				let prefix = name ? `${name}.` : "";
				formData.append(`${prefix}x`, "0");
				formData.append(`${prefix}y`, "0");
			} else if (name) formData.append(name, value);
		}
	} else if (isHtmlElement(target)) throw new Error("Cannot submit element that is not <form>, <button>, or <input type=\"submit|image\">");
	else {
		method = "get";
		action = null;
		encType = defaultEncType;
		body = target;
	}
	if (formData && encType === "text/plain") {
		body = formData;
		formData = void 0;
	}
	return {
		action,
		method: method.toLowerCase(),
		encType,
		formData,
		body
	};
}
//#endregion
export { createSearchParams, getFormSubmissionInfo, getSearchParamsForLocation, shouldProcessLinkClick };
