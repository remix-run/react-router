const PRODUCTION_ERROR = "Invalid history object";

function assertHistory(maybeHistory) {
  if (!maybeHistory) {
    throw new Error(
      process.env.NODE_ENV === "production"
        ? PRODUCTION_ERROR
        : 'Expected history object to be created by the "history" package, but received ' +
          maybeHistory
    );
  }
  if (maybeHistory instanceof global.History) {
    throw new Error(
      process.env.NODE_ENV === "production"
        ? PRODUCTION_ERROR
        : 'Expected history object to be created by the "history" package, but received a DOM History object'
    );
  }

  if (!maybeHistory.push) {
    throw new Error(
      process.env.NODE_ENV === "production"
        ? PRODUCTION_ERROR
        : 'Expected history object to be created by the "history" package, but received some other value'
    );
  }
}

export default assertHistory;
