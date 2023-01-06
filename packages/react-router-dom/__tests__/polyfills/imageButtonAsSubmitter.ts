// Fix jsdom Image Button form submission, until https://github.com/jsdom/jsdom/pull/3480 is merged
window.addEventListener("click", (event) => {
  if (
    event.target instanceof HTMLInputElement &&
    event.target.type === "image" &&
    event.target.form
  ) {
    event.target.form.requestSubmit(event.target);
    event.preventDefault();
  }
});
