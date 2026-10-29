import { expect } from "@playwright/test";
import dedent from "dedent";

import {
  reactRouterConfig,
  test,
  viteConfig,
  viteMajorTemplates,
  type Files,
} from "./helpers/vite.js";

test.describe("Vite forwarded protocol", () => {
  for (let { templateName } of viteMajorTemplates) {
    for (let server of ["dev", "preview"] as const) {
      test(`${templateName} ${server} honors X-Forwarded-Proto without configuration`, async ({
        dev,
        vitePreview,
        request,
      }) => {
        let files: Files = async ({ port }) => ({
          "react-router.config.ts": reactRouterConfig(),
          "vite.config.ts": await viteConfig.basic({ port, templateName }),
          "app/routes/proxy.tsx": dedent`
              import { useActionData, useLoaderData } from "react-router";

              export function loader({ request }) {
                return request.url;
              }

              export function action({ request }) {
                return request.url;
              }

              export default function ProxyRoute() {
                let loaderUrl = useLoaderData();
                let actionUrl = useActionData();
                return <>
                  <p id="loader-url">{loaderUrl}</p>
                  <p id="action-url">{actionUrl}</p>
                </>;
              }
            `,
        });

        let startServer = server === "dev" ? dev : vitePreview;
        let { port } = await startServer(files, templateName);
        let url = `http://localhost:${port}/proxy?query=value`;
        let publicUrl = `https://localhost:${port}/proxy?query=value`;
        let headers = {
          // Simulate an HTTPS-terminating proxy forwarding over HTTP.
          "X-Forwarded-Proto": "https",
          "X-Forwarded-Host": "untrusted.example.com",
        };

        let loaderResponse = await request.get(url, { headers });
        expect(loaderResponse.status()).toBe(200);
        expect(await loaderResponse.text()).toContain(
          `<p id="loader-url">${publicUrl}</p>`,
        );

        let actionResponse = await request.post(url, {
          headers: { ...headers, Origin: `https://localhost:${port}` },
          form: { value: "test" },
        });
        expect(actionResponse.status()).toBe(200);
        expect(await actionResponse.text()).toContain(
          `<p id="action-url">${publicUrl}</p>`,
        );

        // Trusting the protocol must not allow an unrelated action origin.
        let crossOriginResponse = await request.post(url, {
          headers: { ...headers, Origin: "https://untrusted.example.com" },
          form: { value: "test" },
        });
        expect(crossOriginResponse.status()).toBe(400);

        // Requests without forwarded headers continue to use HTTP.
        let directResponse = await request.post(url, {
          headers: { Origin: `http://localhost:${port}` },
          form: { value: "test" },
        });
        expect(directResponse.status()).toBe(200);
        expect(await directResponse.text()).toContain(
          `<p id="action-url">${url}</p>`,
        );
      });
    }
  }
});
