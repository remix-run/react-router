import teardownPuppeteer from "jest-environment-puppeteer/teardown";

module.exports = async (globalConfig: any) => {
  await teardownPuppeteer(globalConfig);
};
