// Drop support for the submitter parameter, as in a legacy browser. This needs
// to be a standalone module due to how jest requires things (i.e. we can't
// just do this inline in data-browser-router-legacy-formdata-test.tsx)
window.FormData = class FormData extends window["FormData"] {
  constructor(form?: HTMLFormElement) {
    super(form, undefined);
  }
};
