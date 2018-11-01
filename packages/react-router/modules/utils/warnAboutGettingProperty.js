import warning from "tiny-warning";

let warnAboutGettingProperty = () => {};
if (__DEV__) {
  warnAboutGettingProperty = (object, key, message) => {
    let didIssueWarning = false;

    const value = object[key];

    Object.defineProperty(object, key, {
      get: () => {
        if (!didIssueWarning) {
          warning(false, message);
          didIssueWarning = true;
        }

        return value;
      },
      configurable: true
    });
  };
}

export default warnAboutGettingProperty;
