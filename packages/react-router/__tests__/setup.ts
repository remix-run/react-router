// https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configuring-your-testing-environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const consoleError = console.error;
console.error = (msg, ...args) => {
  if (
    typeof msg === "string" &&
    msg.includes("react-test-renderer is deprecated")
  ) {
    return;
  }
  consoleError.call(console, msg, ...args);
};
