/*eslint no-console: 0*/
if (process.env.NODE_ENV === "production") {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(ex => {
      console.warn(ex);
      console.warn(
        "(This warning can be safely ignored outside of the production build.)"
      );
    });
  }
}
