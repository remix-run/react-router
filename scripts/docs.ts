import fs from "node:fs";
import path from "node:path";
import util from "node:util";
import fg from "fast-glob";

import dox from "dox";

type UnknownTag = {
  type: string;
  string: string;
  html: string;
};

type ParamTag = {
  type: "param";
  string: string;
  name: string;
  description: string;
  // TODO: Are these used?
  types: [];
  typesDescription: "";
  // end
  variable: boolean;
  nonNullable: boolean;
  nullable: boolean;
  optional: boolean;
};

type Tag = ParamTag | UnknownTag;

type ParsedComment = {
  tags: Tag[];
  description: {
    full: string;
    summary: string;
    body: string;
  };
  isPrivate: boolean;
  isConstructor: boolean;
  isClass: boolean;
  isEvent: boolean;
  ignore: boolean;
  line: number;
  codeStart: number;
  code: string;
  ctx: {
    type: string;
    name: string;
    string: string;
  };
};

export type GetArrayElementType<T extends readonly any[]> =
  T extends readonly (infer U)[] ? U : never;

type Mode = GetArrayElementType<typeof MODES>;
type Category = GetArrayElementType<typeof CATEGORIES>;

type SimplifiedComment = {
  category: Category;
  name: string;
  // TODO: Allow modes on different props
  modes: Mode[];
  summary: string;
  example?: string;
  reference?: string;
  signature: string;
  params: {
    name: string;
    description: string;
  }[];
  returns: string;
};

const MODES = ["framework", "data", "declarative"] as const;
const CATEGORIES = [
  "components",
  "hooks",
  "data routers",
  "declarative routers",
  "utils",
] as const;

// Read a filename from standard input using the node parseArgs utility

const { values: args } = util.parseArgs({
  args: process.argv.slice(2),
  options: {
    path: {
      type: "string",
      short: "p",
    },
    api: {
      type: "string",
      short: "a",
    },
    write: {
      type: "boolean",
      short: "w",
    },
    output: {
      type: "string",
      short: "o",
    },
  },
  allowPositionals: true,
});

function buildApiLookupTable(
  outputDir: string,
  filePaths?: string[],
  apiFilter?: string[] | null
): Map<string, string> {
  const lookup = new Map<string, string>();

  // Add existing files if output directory exists
  if (fs.existsSync(outputDir)) {
    const markdownFiles = fg.sync(`${outputDir}/**/*.md`, {
      onlyFiles: true,
    });

    markdownFiles.forEach((filePath) => {
      const relativePath = path
        .relative(outputDir, filePath)
        .replace(/\.md$/, "");
      const apiName = path.basename(relativePath);

      if (apiName !== "index") {
        lookup.set(apiName, relativePath);
      }
    });
  }

  // Add APIs that will be generated from the source files
  if (filePaths) {
    filePaths.forEach((filePath) => {
      try {
        const comments = parseDocComments(filePath);

        comments.forEach((comment) => {
          // Skip if API filter is provided and this API is not in the filter
          if (apiFilter && !apiFilter.includes(comment.name)) {
            return;
          }

          // Build the relative path based on category
          const categoryFolder = comment.category
            .toLowerCase()
            .replace(/\s+/g, "-");
          const relativePath = `${categoryFolder}/${comment.name}`;

          lookup.set(comment.name, relativePath);
        });
      } catch (error) {
        console.warn(
          `Warning: Could not parse ${filePath} for API lookup: ${error}`
        );
      }
    });
  }

  return lookup;
}

if (!args.path) {
  console.error(
    "Usage: docs.ts --path <filepath-or-glob> [--api <api1,api2,...>] [--write] [--output <output-dir>]"
  );
  console.error("  --path, -p    File path or glob pattern to parse");
  console.error(
    "  --api, -a     Comma-separated list of specific APIs to generate"
  );
  console.error("  --write, -w   Write markdown files to output directory");
  console.error("  --output, -o  Output directory (default: docs/api)");
  process.exit(1);
}

// Parse the API filter if provided
let apiFilter: string[] | null = null;
if (args.api) {
  apiFilter = args.api.split(",").map((name) => name.trim());
}

// Configure output directory
const outputDir = args.output || "docs/api";

// Resolve file paths using glob patterns
const filePaths = fg.sync(args.path, {
  onlyFiles: true,
  ignore: ["**/node_modules/**", "**/__tests__/**", "**/dist/**"],
});

if (filePaths.length === 0) {
  console.error(`No files found matching pattern: ${args.path}`);
  process.exit(1);
}

// Build lookup table for @link resolution (includes existing files + APIs that will be generated)
const apiLookup = buildApiLookupTable(outputDir, filePaths, apiFilter);

// Generate markdown documentation for all matching files
filePaths.forEach((filePath) => {
  console.log(`\nProcessing file: ${filePath}`);
  generateMarkdownDocs(filePath, apiFilter, outputDir, args.write, apiLookup);
});

function generateMarkdownDocs(
  filepath: string,
  apiFilter?: string[] | null,
  outputDir?: string,
  writeFiles?: boolean,
  apiLookup?: Map<string, string>
) {
  let data = parseDocComments(filepath);

  data.forEach((comment) => {
    // Skip if API filter is provided and this API is not in the filter
    if (apiFilter && !apiFilter.includes(comment.name)) {
      return;
    }

    // Generate markdown content for each public function
    let markdownContent = generateMarkdownForComment(comment, apiLookup);
    if (markdownContent) {
      if (writeFiles && outputDir) {
        // Write to file based on category
        writeMarkdownFile(comment, markdownContent, outputDir);
      } else {
        // Print to console (existing behavior)
        console.log(`\n=== Markdown for ${comment.name} ===`);
        console.log(markdownContent);
        console.log(`=== End of ${comment.name} ===\n`);
      }
    }
  });
}

function writeMarkdownFile(
  comment: SimplifiedComment,
  markdownContent: string,
  outputDir: string
) {
  // Convert category to lowercase and replace spaces with hyphens for folder name
  const categoryFolder = comment.category.toLowerCase().replace(/\s+/g, "-");

  // Create the full directory path
  const targetDir = path.join(outputDir, categoryFolder);

  // Ensure the directory exists
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // Create the filename (e.g., useHref.md)
  const filename = `${comment.name}.md`;
  const filePath = path.join(targetDir, filename);

  // Write the file
  fs.writeFileSync(filePath, markdownContent, "utf8");
  console.log(`✓ Written: ${filePath}`);
}

function generateMarkdownForComment(
  comment: SimplifiedComment,
  apiLookup?: Map<string, string>
): string {
  let markdown = "";

  // Skip functions without proper names
  if (!comment.name || comment.name === "undefined") {
    return "";
  }

  // Title with frontmatter
  markdown += `---\n`;
  markdown += `title: ${comment.name}\n`;
  markdown += `---\n\n`;

  markdown += `# ${comment.name}\n\n`;

  // Modes section
  if (comment.modes && comment.modes.length > 0) {
    markdown += `[MODES: ${comment.modes.join(", ")}]\n\n`;
  }

  // Summary section
  markdown += `## Summary\n\n`;

  // Generate reference documentation link from @reference tag or fallback to default
  if (comment.reference) {
    markdown += `[Reference Documentation ↗](https://api.reactrouter.com/v7/${comment.reference})\n\n`;
  }

  // Clean up HTML tags from summary and convert to plain text
  let summary = comment.summary;

  // Resolve {@link ...} tags in the summary
  if (apiLookup) {
    summary = resolveLinkTags(summary, apiLookup);
  }

  markdown += `${summary}\n\n`;

  // Example section (if available)
  if (comment.example) {
    let cleanExample = comment.example;

    // Resolve {@link ...} tags in the example
    if (apiLookup) {
      cleanExample = resolveLinkTags(cleanExample, apiLookup);
    }

    markdown += `\`\`\`tsx\n${cleanExample}\n\`\`\`\n\n`;
  }

  // Signature section
  markdown += `## Signature\n\n`;
  markdown += "```tsx\n";
  markdown += `${comment.signature}\n`;
  markdown += "```\n\n";

  // Parameters section
  if (comment.params && comment.params.length > 0) {
    markdown += `## Params\n\n`;
    comment.params.forEach((param, i) => {
      // Only show modes for parameters if they differ from hook-level modes
      // For now, we assume all parameters have the same modes as the hook
      // This could be enhanced in the future if we need per-parameter mode support

      // Clean up HTML tags from description
      let description = param.description;

      // Resolve {@link ...} tags in parameter descriptions
      if (apiLookup) {
        description = resolveLinkTags(description, apiLookup);
      }

      // Skip options object param that is there for JSDoc since we will document each option on it own
      if (param.name === "options" && description === "Options") {
        if (!comment.params[i + 1].name.startsWith("options.")) {
          throw new Error(
            "Expected docs for individual options: " + comment.name
          );
        }
        return;
      }

      markdown += `### ${param.name}\n\n`;
      markdown += `${description || "_No documentation_"}\n\n`;
    });
  }

  return markdown;
}

function parseDocComments(filepath: string): SimplifiedComment[] {
  let code = fs.readFileSync(filepath).toString();
  let comments = dox.parseComments(code, { raw: true }) as ParsedComment[];
  return comments
    .filter((c) => c.tags.some((t) => t.type === "public"))
    .map((c) => simplifyComment(c));
}

function simplifyComment(comment: ParsedComment): SimplifiedComment {
  let name = comment.ctx.name;
  if (!name) {
    let matches = comment.code.match(/function ([^<(]+)/);
    if (matches) {
      name = matches[1];
    }
    if (!name) {
      throw new Error(`Expected a @name tag: ${comment.code}`);
    }
  }

  let categoryTags = comment.tags.filter((t) => t.type === "category");
  if (categoryTags.length !== 1) {
    throw new Error(`Expected a single category tag: ${name}`);
  }
  let category = categoryTags[0].string as Category;

  let modes: Mode[] = [...MODES];
  let modeTags = comment.tags.filter((t) => t.type === "mode");
  if (modeTags.length > 0) {
    modes = modeTags.map((mode) => mode.string as Mode);
  }

  let summary = comment.description.full;
  if (!summary) {
    throw new Error(`Expected a summary: ${name}`);
  }

  let example = comment.tags.find((t) => t.type === "example")?.string;

  let reference = comment.tags.find((t) => t.type === "reference")?.string;
  if (!reference) {
    throw new Error(`Expected a @reference tag: ${name}`);
  }

  let code = comment.code.replace("\n", "").trim();
  let signature: string;
  let matches = code.match(/^export (async )?function ([^{]+)/);
  if (matches) {
    signature = matches[2];
  } else {
    throw new Error(`Expected an export function: ${code}`);
  }

  let params: SimplifiedComment["params"] = [];
  comment.tags.forEach((tag) => {
    if (isParamTag(tag)) {
      params.push({
        name: tag.name,
        description: tag.description,
      });
    }
  });

  let returns = comment.tags.find((t) => t.type === "returns")?.string;
  if (!returns) {
    throw new Error(`Expected a @returns tag: ${name}`);
  }

  return {
    category,
    name,
    modes,
    summary,
    example,
    reference,
    signature,
    params,
    returns,
  };
}

function isParamTag(tag: Tag): tag is ParamTag {
  return tag.type === "param";
}

/**
 * Resolves {@link ...} tags in JSDoc text and converts them to markdown links
 * @param text - The text containing {@link ...} tags
 * @param apiLookup - Map of API names to their relative paths
 * @returns Text with {@link ...} tags replaced by markdown links
 */
function resolveLinkTags(text: string, apiLookup: Map<string, string>): string {
  // Match {@link ApiName} or {@link ApiName description}
  const linkPattern = /\{@link\s+([^}]+)\}/g;

  return text.replace(linkPattern, (match, linkContent) => {
    const parts = linkContent
      .replace("@link", "")
      .trim()
      .split("|")
      .map((p) => p.trim());
    const apiName = parts[0];
    const description = parts[1] || `\`${apiName}\``;

    // Look up the API in the lookup table
    const relativePath = apiLookup.get(apiName);

    if (relativePath) {
      // Convert to markdown link with relative path (no .md extension)
      return `[${description}](../${relativePath})`;
    } else {
      // If not found, return as plain text with a warning
      console.warn(
        `Warning: Could not resolve {@link ${apiName}} in documentation`
      );
      return description;
    }
  });
}
