import { installGlobals } from "@remix-run/node";
require("expect-puppeteer");
require("pptr-testing-library/extend");
installGlobals();

jest.setTimeout(10000);
