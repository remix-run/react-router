// Match invalidProtocols in react-router/lib/router/router.ts and also reject
// the legacy VBScript scheme. These utilities are not exported by react-router.
const invalidProtocols = new Set([
  "about:",
  "blob:",
  "chrome:",
  "chrome-untrusted:",
  "content:",
  "data:",
  "devtools:",
  "file:",
  "filesystem:",
  // eslint-disable-next-line no-script-url
  "javascript:",
  "vbscript:",
]);

// Keep in sync with escapeAttribute in react-router/lib/dom/ssr/markup.ts.
// HTML entities work in both text and double-quoted attributes;
// JavaScript escapes do not.
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getPrerenderRedirectHtml(response: Response, pathname: string) {
  let location = response.headers.get("Location") ?? "";
  let protocol: string | undefined;
  try {
    // Parse as the browser does, including case and embedded tabs/newlines.
    protocol = new URL(location).protocol;
  } catch {
    // Relative URLs do not have a protocol.
  }
  if (protocol && invalidProtocols.has(protocol)) {
    throw new Error(
      `Cannot prerender redirect for ${JSON.stringify(pathname)}: unsafe URL protocol ${JSON.stringify(protocol)}`,
    );
  }

  // A short delay causes Google to interpret the redirect as temporary.
  // https://developers.google.com/search/docs/crawling-indexing/301-redirects#metarefresh
  let delay = response.status === 302 ? 2 : 0;
  let escapedLocation = escapeHtml(location);
  let escapedPathname = escapeHtml(pathname);
  return `<!doctype html>
<head>
<title>Redirecting to: ${escapedLocation}</title>
<meta http-equiv="refresh" content="${delay};url=${escapedLocation}">
<meta name="robots" content="noindex">
</head>
<body>
  <a href="${escapedLocation}">
    Redirecting from <code>${escapedPathname}</code> to <code>${escapedLocation}</code>
  </a>
</body>
</html>`;
}
