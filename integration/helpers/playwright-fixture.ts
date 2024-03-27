import cp from "node:child_process";
import type { Page, Response, Request } from "@playwright/test";
import { test } from "@playwright/test";
import cheerio from "cheerio";
import prettier from "prettier";

import type { AppFixture } from "./create-fixture.js";

export class PlaywrightFixture {
  readonly page: Page;
  readonly app: AppFixture;

  constructor(app: AppFixture, page: Page) {
    this.page = page;
    this.app = app;
  }

  /**
   * Visits the href with a document request.
   *
   * @param href The href you want to visit
   * @param waitForHydration Wait for the page to full load/hydrate?
   *  - `undefined` to wait for the document `load` event
   *  - `true` wait for the network to be idle, so everything should be loaded
   *    and ready to go
   *  - `false` to wait only until the initial doc to be returned and the document
   *    to start loading (mostly useful for testing deferred responses)
   */
  async goto(href: string, waitForHydration?: boolean): Promise<Response> {
    let response = await this.page.goto(this.app.serverUrl + href, {
      waitUntil:
        waitForHydration === true
          ? "networkidle"
          : waitForHydration === false
          ? "commit"
          : "load",
    });
    if (response == null)
      throw new Error(
        "Unexpected null response, possible about:blank request or same-URL redirect"
      );
    return response;
  }

  /**
   * Finds a link on the page with a matching href, clicks it, and waits for
   * the network to be idle before continuing.
   *
   * @param href The href of the link you want to click
   * @param options `{ wait }` waits for the network to be idle before moving on
   */
  async clickLink(href: string, options: { wait: boolean } = { wait: true }) {
    let selector = `a[href="${href}"]`;
    let el = await this.page.$(selector);
    if (!el) {
      throw new Error(`Could not find link for ${selector}`);
    }
    if (options.wait) {
      await doAndWait(this.page, () => el!.click());
    } else {
      await el.click();
    }
  }

  /**
   * Find the input element and fill for file uploads.
   *
   * @param inputSelector The selector of the input you want to fill
   * @param filePaths The paths to the files you want to upload
   */
  async uploadFile(inputSelector: string, ...filePaths: string[]) {
    let el = await this.page.$(inputSelector);
    if (!el) {
      throw new Error(`Could not find input for: ${inputSelector}`);
    }
    await el.setInputFiles(filePaths);
  }

  /**
   * Finds the first submit button with `formAction` that matches the
   * `action` supplied, clicks it, and optionally waits for the network to
   * be idle before continuing.
   *
   * @param action The formAction of the button you want to click
   * @param options `{ wait }` waits for the network to be idle before moving on
   */
  async clickSubmitButton(
    action: string,
    options: { wait?: boolean; method?: string } = { wait: true }
  ) {
    let selector: string;
    if (options.method) {
      selector = `button[formAction="${action}"][formMethod="${options.method}"]`;
    } else {
      selector = `button[formAction="${action}"]`;
    }

    let el = await this.page.$(selector);
    if (!el) {
      if (options.method) {
        selector = `form[action="${action}"] button[type="submit"][formMethod="${options.method}"]`;
      } else {
        selector = `form[action="${action}"] button[type="submit"]`;
      }
      el = await this.page.$(selector);
      if (!el) {
        throw new Error(`Can't find button for: ${action}`);
      }
    }
    if (options.wait) {
      await doAndWait(this.page, () => el!.click());
    } else {
      await el.click();
    }
  }

  /**
   * Clicks any element and waits for the network to be idle.
   */
  async clickElement(selector: string) {
    let el = await this.page.$(selector);
    if (!el) {
      throw new Error(`Can't find element for: ${selector}`);
    }
    await doAndWait(this.page, () => el!.click());
  }

  /**
   * Perform any interaction and wait for the network to be idle:
   *
   * ```ts
   * await app.waitForNetworkAfter(page, () => app.page.focus("#el"))
   * ```
   */
  async waitForNetworkAfter(fn: () => Promise<unknown>) {
    await doAndWait(this.page, fn);
  }

  /**
   * "Clicks" the back button and optionally waits for the network to be
   * idle (defaults to waiting).
   */
  async goBack(options: { wait: boolean } = { wait: true }) {
    if (options.wait) {
      await doAndWait(this.page, () => this.page.goBack());
    } else {
      await this.page.goBack();
    }
  }

  /**
   * "Clicks" the refresh button.
   */
  async reload(options: { wait: boolean } = { wait: true }) {
    if (options.wait) {
      await doAndWait(this.page, () => this.page.reload());
    } else {
      await this.page.reload();
    }
  }

  /**
   * Collects data responses from the network, usually after a link click or
   * form submission. This is useful for asserting that specific loaders
   * were called (or not).
   */
  collectDataResponses() {
    return this.collectResponses((url) => url.searchParams.has("_data"));
  }

  /**
   * Collects single fetch data responses from the network, usually after a
   * link click or form submission. This is useful for asserting that specific
   * loaders were called (or not).
   */
  collectSingleFetchResponses() {
    return this.collectResponses((url) => url.pathname.endsWith(".data"));
  }

  /**
   * Collects all responses from the network, usually after a link click or
   * form submission. A filter can be provided to only collect responses
   * that meet a certain criteria.
   */
  collectResponses(filter?: (url: URL) => boolean) {
    let responses: Response[] = [];

    this.page.on("response", (res) => {
      if (!filter || filter(new URL(res.url()))) {
        responses.push(res);
      }
    });

    return responses;
  }

  /**
   * Get HTML from the page. Useful for asserting something rendered that
   * you expected.
   *
   * @param selector CSS Selector for the element's HTML you want
   */
  getHtml(selector?: string) {
    return getHtml(this.page, selector);
  }

  /**
   * Get a cheerio instance of an element from the page.
   *
   * @param selector CSS Selector for the element's HTML you want
   */
  async getElement(selector: string) {
    return getElement(await getHtml(this.page), selector);
  }

  /**
   * Keeps the fixture running for as many seconds as you want so you can go
   * poke around in the browser to see what's up.
   *
   * @param seconds How long you want the app to stay open
   */
  async poke(seconds: number = 10, href: string = "/") {
    let ms = seconds * 1000;
    test.setTimeout(ms);
    console.log(
      `🙈 Poke around for ${seconds} seconds 👉 ${this.app.serverUrl}`
    );
    cp.exec(`open ${this.app.serverUrl}${href}`);
    return new Promise((res) => setTimeout(res, ms));
  }
}

export async function getHtml(page: Page, selector?: string) {
  let html = await page.content();
  return selector ? selectHtml(html, selector) : prettyHtml(html);
}

export function getElement(source: string, selector: string) {
  let el = cheerio(selector, source);
  if (!el.length) {
    throw new Error(`No element matches selector "${selector}"`);
  }
  return el;
}

export function selectHtml(source: string, selector: string) {
  let el = getElement(source, selector);
  return prettyHtml(cheerio.html(el)).trim();
}

export function prettyHtml(source: string): string {
  return prettier.format(source, { parser: "html" });
}

async function doAndWait(
  page: Page,
  action: () => Promise<unknown>,
  longPolls = 0
) {
  let DEBUG = !!process.env.DEBUG;
  let networkSettledCallback: any;
  let networkSettledPromise = new Promise((resolve) => {
    networkSettledCallback = resolve;
  });

  let requestCounter = 0;
  let actionDone = false;
  let pending = new Set<Request>();

  let maybeSettle = () => {
    if (actionDone && requestCounter <= longPolls) networkSettledCallback();
  };

  let onRequest = (request: Request) => {
    ++requestCounter;
    if (DEBUG) {
      pending.add(request);
      console.log(`+[${requestCounter}]: ${request.url()}`);
    }
  };
  let onRequestDone = (request: Request) => {
    // Let the page handle responses asynchronously (via setTimeout(0)).
    //
    // Note: this might be changed to use delay, e.g. setTimeout(f, 100),
    // when the page uses delay itself.
    let evaluate = page.evaluate(() => {
      return new Promise((resolve) => setTimeout(resolve, 0));
    });
    evaluate
      .catch(() => null)
      .then(() => {
        --requestCounter;
        maybeSettle();
        if (DEBUG) {
          pending.delete(request);
          console.log(`-[${requestCounter}]: ${request.url()}`);
        }
      });
  };

  page.on("request", onRequest);
  page.on("requestfinished", onRequestDone);
  page.on("requestfailed", onRequestDone);
  page.on("load", networkSettledCallback); // e.g. navigation with javascript disabled

  let timeoutId = DEBUG
    ? setInterval(() => {
        console.log(`${requestCounter} requests pending:`);
        for (let request of pending) console.log(`  ${request.url()}`);
      }, 5000)
    : undefined;

  let result = await action();
  actionDone = true;
  maybeSettle();
  if (DEBUG) {
    console.log(`action done, ${requestCounter} requests pending`);
  }
  await networkSettledPromise;

  // I wish I knew why but Safari seems to get all screwed up without this.
  // When you run doAndWait (via clicking a blink or submitting a form) and
  // then waitForSelector().  It finds the selector element but thinks it's
  // hidden for some unknown reason.  It's intermittent, but waiting for the
  // next animation frame delaying slightly before the waitForSelector() calls
  // seems to fix it 🤷‍♂️
  //
  //   Test timeout of 30000ms exceeded.
  //
  //   Error: page.waitForSelector: Target closed
  //   =========================== logs ===========================
  //   waiting for locator('text=ROOT_BOUNDARY_TEXT') to be visible
  //     locator resolved to hidden <div id="root-boundary">ROOT_BOUNDARY_TEXT</div>
  //     locator resolved to hidden <div id="root-boundary">ROOT_BOUNDARY_TEXT</div>
  //     ... and so on until the test times out
  let userAgent = await page.evaluate(() => navigator.userAgent);
  if (/Safari\//i.test(userAgent) && !/Chrome\//i.test(userAgent)) {
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(r)));
  }

  if (DEBUG) {
    console.log(`action done, network settled`);
  }

  page.removeListener("request", onRequest);
  page.removeListener("requestfinished", onRequestDone);
  page.removeListener("requestfailed", onRequestDone);
  page.removeListener("load", networkSettledCallback);

  if (DEBUG && timeoutId) {
    clearTimeout(timeoutId);
  }

  return result;
}
