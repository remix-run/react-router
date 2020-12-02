import chalk from "chalk";
import cheerio from "cheerio";
import fetch from "node-fetch";

function getPageUrl(url) {
  if (typeof url === "string") url = new URL(url);
  // Use the URL w/out the hash.
  return new URL(url.origin + url.pathname + url.search);
}

const pageCache = {};

function createPage(url) {
  let pageUrl = getPageUrl(url);

  let cachedPage = pageCache[pageUrl];
  if (cachedPage) return cachedPage;

  let page = {
    url: pageUrl,
    anchors: null,
    links: null,
    checkedLinks: [],
    brokenLinks: []
  };

  pageCache[page.url] = page;

  return page;
}

async function getPageAnchorsAndLinks(page) {
  if (page.anchors && page.links) return;

  let res;
  try {
    res = await fetch(page.url.toString());
  } catch (error) {
    console.error(error.message);
    return null;
  }

  if (res.status !== 200) {
    throw new Error(`${res.status} error fetching URL: ${page.url}`);
  }

  let $ = cheerio.load(await res.text());

  page.anchors = [];
  page.links = [];

  // GH puts all user-generated markdown in a <div class="markdown-body">
  let isGitHubMarkdown = false;
  let selectorContext = undefined;
  if (page.url.hostname === "github.com") {
    let $markdownBody = $(".markdown-body");
    if ($markdownBody.length > 0) {
      isGitHubMarkdown = true;
      selectorContext = ".markdown-body";
    }
  }

  $("[id]", selectorContext).each((index, a) => {
    let id = $(a).attr("id");

    // GH prefixes the ids of links that point to themselves with the
    // string "user-content-", so you end up with links like
    // <a id="user-content-react-router" href="#react-router">
    // GH makes these links work by using JavaScript to adjust the page's scroll
    // position when the URL fragment id matches an anchor with the "user-content-"
    // prefix, so just treat this link as if it had the correct id to begin with
    if (isGitHubMarkdown && id.startsWith("user-content-")) {
      id = id.replace(/^user-content-/, "");
    }

    page.anchors.push({ id, text: $(a).text() });
  });

  $("a[href]", selectorContext).each((index, a) => {
    let to = new URL($(a).attr("href"), page.url);
    page.links.push({ to, text: $(a).text() });
  });
}

function defaultShouldCheckPage(url) {
  return true;
}

function defaultShouldCheckLink(url) {
  return true;
}

async function checkPageLinks(page, options = {}, checkedPages = []) {
  let {
    shouldCheckPage = defaultShouldCheckPage,
    shouldCheckLink = defaultShouldCheckLink
  } = options;

  console.log(`Checking ${page.url} ...`);

  checkedPages.push(page);

  await getPageAnchorsAndLinks(page);

  for (let link of page.links) {
    if (!shouldCheckLink(link)) continue;

    page.checkedLinks.push(link);

    // Make sure the link points to a valid page.
    let linkedPage = createPage(link.to);
    try {
      await getPageAnchorsAndLinks(linkedPage);
    } catch (error) {
      page.brokenLinks.push(link);
      continue;
    }

    // Make sure the link points to a valid anchor on that page.
    if (link.to.hash) {
      let id = link.to.hash.slice(1);
      let anchor = linkedPage.anchors.find(a => a.id === id);
      if (anchor == null) {
        page.brokenLinks.push(link);
      }
    }

    // Check the page it links to.
    if (!checkedPages.includes(linkedPage) && shouldCheckPage(linkedPage)) {
      await checkPageLinks(linkedPage, options, checkedPages);
    }
  }

  return checkedPages;
}

const startPage = createPage(
  "https://github.com/ReactTraining/react-router/tree/dev/docs"
);

checkPageLinks(startPage, {
  shouldCheckPage(page) {
    return (
      page.url.hostname === "github.com" &&
      /^\/ReactTraining\/react-router\/(tree|blob)\/dev\/docs/i.test(
        page.url.pathname
      )
    );
  },
  shouldCheckLink(link) {
    return link.to.hash !== "#TODO";
  }
}).then(checkedPages => {
  checkedPages.forEach(page => {
    let { url, checkedLinks, brokenLinks } = page;

    if (brokenLinks.length === 0) {
      console.log(
        chalk.green(
          `Found 0 broken links at ${url} (out of ${checkedLinks.length} total)`
        )
      );
    } else {
      console.log(
        chalk.red(
          `Found ${brokenLinks.length} broken link${
            brokenLinks.length === 1 ? "" : "s"
          } at ${url} (out of ${checkedLinks.length} total):`
        )
      );

      brokenLinks.forEach(link => {
        console.log("  " + link.to);
      });
    }
  });
});
