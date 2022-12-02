import { installGlobals as installNodeGlobals } from "@remix-run/node";

export async function installGlobals(framework: 'jsdom' | 'happy-dom' = 'jsdom') {
  installNodeGlobals();

  if (framework === 'happy-dom') {
    throw new Error(
      `happy-dom is not currently supported as it doesn't have a FormData implementation`
    );
  }

  let JSDOM = await import("jsdom").catch(() => {
    throw new Error(
      `Could not locate jsdom. Please verify you have it installed.`
    );
  });

  let jsdom = new JSDOM.JSDOM(`<!doctype html>`);
  globalThis.FormData = jsdom.window.FormData;
}
