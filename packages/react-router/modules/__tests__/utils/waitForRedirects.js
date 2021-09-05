function waitForRedirects(callback) {
  // TODO: Hook into <Redirect> so we can know when
  // the redirect actually happens instead of guessing.
  setTimeout(callback, 100);
}

export default waitForRedirects;
