// Hey!
//
// This does a few things:
//
// - converts markdown to html
// - replaces all internal github markdown links to work for
//   the website, internal document links, internal package links,
//   and cross-package links (react-router-dom linking to react-router)
// - highlights the code

const markdownIt = require("markdown-it");
const Prism = require("prismjs");
const cheerio = require("cheerio");
const path = require("path");
const slug = require("slug");
const resolve = require("resolve-pathname");
const loaderUtils = require("loader-utils");

const routerDelegationClassName = "internal-link";

// charmap gets rid of weird <Route> -> lessRoutegreater
const slugify = s => slug(s, { charmap: {} });

const aliases = {
  js: "jsx",
  html: "markup",
  sh: "bash"
};

const highlight = (str, lang) => {
  if (!lang) {
    return str;
  } else {
    lang = aliases[lang] || lang;
    require(`prismjs/components/prism-${lang}.js`);
    if (Prism.languages[lang]) {
      return Prism.highlight(str, Prism.languages[lang]);
    } else {
      return str;
    }
  }
};

const extractHeaders = ($, level, type) =>
  $(level)
    .map((n, e) => {
      const $e = $(e);
      const text = $e.text();
      return {
        text: text,
        slug:
          type === "api" && level === "h1"
            ? slugify(text)
            : slugify(text).toLowerCase()
      };
    })
    .get();

const envMap = {
  "react-router": "core",
  "react-router-native": "native",
  "react-router-dom": "web"
};

const isSelfHeader = href => href === "";

const isSibling = href => href.startsWith("./");

const isOtherTypeSibling = href =>
  href.startsWith("../api") || href.startsWith("../guide");

const isCrossPackage = href => href.startsWith("../../../");

const makeHref = (basename, hash, ...segments) => {
  let href = basename + "/" + segments.join("/").replace(/\.md$/, "");
  if (hash) href += "/" + hash;
  return href;
};

const correctLinks = ($, moduleSlug, environment, type, basename) => {
  $("a[href]").each((i, e) => {
    const $e = $(e);
    const [href, hash] = $e.attr("href").split("#");

    if (isSelfHeader(href)) {
      // #render-func
      // /web/api/Route/render-func
      $e.attr(
        "href",
        `${basename}/${environment}/${type}/${moduleSlug}/${hash}`
      );
      $e.addClass(routerDelegationClassName);
    } else if (isSibling(href)) {
      // ./quick-start.md
      // /web/guides/quick-start
      const [_, doc] = href.split("/");

      $e.attr("href", makeHref(basename, hash, environment, type, doc));
      $e.addClass(routerDelegationClassName);
    } else if (isOtherTypeSibling(href)) {
      // ../api/NativeRouter.md
      // /web/api/NativeRouter
      const [_, type, doc] = href.split("/");
      $e.attr("href", makeHref(basename, hash, environment, type, doc));
      $e.addClass(routerDelegationClassName);
    } else if (isCrossPackage(href)) {
      // ../../../react-router/docs/api/Route.md
      // /core/api/Route
      const [$0, $1, $2, env, $4, type, doc] = href.split("/");
      $e.attr("href", makeHref(basename, hash, envMap[env], type, doc));
      $e.addClass(routerDelegationClassName);
    }
  });
};

const makeHeaderLinks = ($, moduleSlug, environment, type, basename) => {
  // can abstract these two things a bit, but it's late.
  $("h1").each((i, e) => {
    const $e = $(e);
    $e.attr("id", moduleSlug);
    const children = $e.html();
    const link = $(
      `<a href="${basename}/${environment}/${type}/${moduleSlug}" class="${routerDelegationClassName}"/>`
    );
    link.html(children);
    $e.empty().append(link);
  });

  $("h2").each((i, e) => {
    const $e = $(e);
    const rawSlug = slugify($e.text());
    const slug = rawSlug.toLowerCase();
    $e.attr("id", `${moduleSlug}-${slug}`);
    const children = $e.html();
    const link = $(
      `<a href="${basename}/${environment}/${type}/${moduleSlug}/${slug}" class="${routerDelegationClassName}"/>`
    );
    link.html(children);
    $e.empty().append(link);
  });
};

const md = markdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight
});

module.exports = function(content) {
  this.cacheable();
  const options = loaderUtils.getOptions(this);
  const basename = (options && options.basename) || "";
  const markup = md.render(content);
  const $markup = cheerio.load(markup);
  const title = extractHeaders($markup, "h1", this.data.type)[0];
  correctLinks(
    $markup,
    title.slug,
    this.data.environment,
    this.data.type,
    basename
  );
  makeHeaderLinks(
    $markup,
    title.slug,
    this.data.environment,
    this.data.type,
    basename
  );
  const headers = extractHeaders($markup, "h2", this.data.type);
  const value = {
    markup: $markup.html(),
    headers: headers,
    title: title
  };
  return `module.exports = ${JSON.stringify(value)}`;
};

module.exports.pitch = function(remainingRequest, precedingRequest, data) {
  // figures out the environment by either parsing off a query
  // i.e. '../../react-router/docs/api/Route.md?web'
  // so we can import Route.md and render at "/web/api/Route"
  // if there is no query then it figures it out based on the
  // require path
  const envMatch = remainingRequest.match(/\?(.+)$/);
  const reverseSplit = remainingRequest.split("/").reverse();
  data.environment = envMatch ? envMatch[1] : envMap[reverseSplit[3]]; // 3 = react-router|react-router-dom etc.
  data.type = reverseSplit[1]; // api | guide
};
