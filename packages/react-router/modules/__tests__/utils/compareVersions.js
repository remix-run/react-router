function compareVersions(a, b) {
  const aparts = a.split(".").map(part => parseInt(part));
  const bparts = b.split(".").map(part => parseInt(part));

  return aparts.reduce((ret, apart, index) => {
    const bpart = bparts[index] || 0;

    if (ret !== 0) {
      return ret;
    }

    return Math.sign(apart - bpart);
  }, 0);
}

export default compareVersions;
