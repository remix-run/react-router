export let jestTimeout = process.platform === "win32" ? 20_000 : 10_000;

jest.setTimeout(jestTimeout);
