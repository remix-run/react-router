function resetHash(done) {
  if (window.location.hash !== '') {
    window.location.hash = '';
    setTimeout(done, 10);
  } else {
    done();
  }
}

export default resetHash;
