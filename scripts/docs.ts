import fs from "node:fs";
import path from "node:path";
import util from "node:util";
import fg from "fast-glob";

import dox from "dox";
import { ReflectionKind, type JSONOutput } from "typedoc";
import ts from "typescript";

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
  additionalExamples?: string;
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

// Build lookup table for @link resolution
const repoApiLookup = buildRepoDocsLookupTable(outputDir);
const typedocLookup = buildTypedocLookupTable(outputDir);

// Resolve file paths using glob patterns
const filePaths = fg.sync(args.path, {
  onlyFiles: true,
  ignore: ["**/node_modules/**", "**/__tests__/**", "**/dist/**"],
});

if (filePaths.length === 0) {
  console.error(`No files found matching pattern: ${args.path}`);
  process.exit(1);
}

// Generate markdown documentation for all matching files
filePaths.forEach((filePath) => {
  console.log(`\nProcessing file: ${filePath}`);
  generateMarkdownDocs(filePath, apiFilter, outputDir, args.write);
});

function buildRepoDocsLookupTable(outputDir: string): Map<string, string> {
  const lookup = new Map<string, string>();

  // Add existing files if output directory exists
  if (!fs.existsSync(outputDir)) {
    throw new Error(
      `Docs directory does not exist for cross-linking: ${outputDir}`
    );
  }

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

  return lookup;
}
function buildTypedocLookupTable(outputDir: string): Map<string, string> {
  const lookup = new Map<string, string>();

  // Prerequisite: `typedoc` has been run first via `npm run docs`
  if (fs.existsSync("public/dev/api.json")) {
    let apiData = JSON.parse(
      fs.readFileSync("public/dev/api.json", "utf8")
    ) as JSONOutput.ProjectReflection;

    apiData.children
      ?.filter((c) => c.kind === ReflectionKind.Module)
      .forEach((child) => processTypedocModule(child, lookup));
  } else {
    console.warn(
      '⚠️ Typedoc API data not found at "public/dev/api.json", will not automatically cross-link to Reference Docs'
    );
  }

  return lookup;
}

function processTypedocModule(
  child: JSONOutput.ReferenceReflection | JSONOutput.DeclarationReflection,
  lookup: Map<string, string>,
  prefix: string[] = []
) {
  let newPrefix = [...prefix, child.name];
  let moduleName = newPrefix.join(".");
  child.children?.forEach((subChild) => {
    // Recurse into submodules
    if (subChild.kind === ReflectionKind.Module) {
      processTypedocModule(subChild, lookup, newPrefix);
      return;
    }

    // Prefer linking to repo docs over typedoc docs
    if (lookup.has(subChild.name)) {
      return;
    }

    let apiName = `${moduleName}.${subChild.name}`;
    let type =
      subChild.kind === ReflectionKind.Enum
        ? "enums"
        : subChild.kind === ReflectionKind.Class
        ? "classes"
        : subChild.kind === ReflectionKind.Interface
        ? "interfaces"
        : subChild.kind === ReflectionKind.TypeAlias
        ? "types"
        : subChild.kind === ReflectionKind.Function
        ? "functions"
        : subChild.kind === ReflectionKind.Variable
        ? "variables"
        : undefined;

    if (!type) {
      console.warn(
        `Skipping ${apiName} because it is not a function, class, enum, interface, or type`
      );
      return;
    }
    let modulePath = moduleName.replace(/[@\-/]/g, "_");
    let path = `${type}/${modulePath}.${subChild.name}.html`;
    let url = `https://api.reactrouter.com/v7/${path}`;
    lookup.set(subChild.name, url);
  });
}

function generateMarkdownDocs(
  filepath: string,
  apiFilter?: string[] | null,
  outputDir?: string,
  writeFiles?: boolean
) {
  let data = parseDocComments(filepath);

  data.forEach((comment) => {
    // Skip if API filter is provided and this API is not in the filter
    if (apiFilter && !apiFilter.includes(comment.name)) {
      return;
    }

    // Generate markdown content for each public function
    let markdownContent = generateMarkdownForComment(comment);
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

function generateMarkdownForComment(comment: SimplifiedComment): string {
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

  markdown += `<!--\n`;
  markdown += `⚠️ ⚠️ IMPORTANT ⚠️ ⚠️ \n\n`;
  markdown += `Hey! Thank you for helping improve our documentation!\n\n`;
  markdown += `This file is auto-generated from the JSDoc comments in the source\n`;
  markdown += `code, so please find the definition of this API and edit the JSDoc\n`;
  markdown += `comments accordingly and this file will be re-generated once those\n`;
  markdown += `changes are merged.\n`;
  markdown += `-->\n\n`;

  // Modes section
  if (comment.modes && comment.modes.length > 0) {
    markdown += `[MODES: ${comment.modes.join(", ")}]\n\n`;
  }

  // Summary section
  markdown += `## Summary\n\n`;

  // Generate reference documentation link from @reference tag or fallback to default
  if (comment.reference) {
    markdown += `[Reference Documentation ↗](${comment.reference})\n\n`;
  }

  // Clean up HTML tags from summary and convert to plain text
  let summary = resolveLinkTags(comment.summary);
  markdown += `${summary}\n\n`;

  // Example section (if available)
  if (comment.example) {
    let example = resolveLinkTags(comment.example);
    markdown += `\`\`\`tsx\n${example}\n\`\`\`\n\n`;
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
      let description = resolveLinkTags(param.description);

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

  // Additional Examples section (if available)
  if (comment.additionalExamples) {
    let additionalExamples = resolveLinkTags(comment.additionalExamples);
    markdown += `## Examples\n\n`;
    markdown += `${additionalExamples}\n\n`;
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
      throw new Error(`Could not determine API name:\n${comment.code}\n`);
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
  let additionalExamples = comment.tags.find(
    (t) => t.type === "additionalExamples"
  )?.string;

  let reference = typedocLookup.get(name);
  if (!reference) {
    throw new Error(`Could not find API in typedoc reference docs: ${name}`);
  }

  let signature = getSignature(comment.code);

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
    additionalExamples,
    reference,
    signature,
    params,
    returns,
  };
}

function isParamTag(tag: Tag): tag is ParamTag {
  return tag.type === "param";
}

// Parse the TypeScript code into an AST so we can remove the function body
// and just grab the signature
function getSignature(code: string): string {
  const ast = ts.createSourceFile("example.ts", code, ts.ScriptTarget.Latest);
  if (ast.statements.length === 0) {
    throw new Error(`Expected one or more statements: ${code}`);
  }

  let functionDeclaration = ast.statements[0];
  if (!ts.isFunctionDeclaration(functionDeclaration)) {
    throw new Error(`Expected a function declaration: ${code}`);
  }

  let modifiedFunction = {
    ...functionDeclaration,
    modifiers: functionDeclaration.modifiers?.filter(
      (m) => m.kind !== ts.SyntaxKind.ExportKeyword
    ),
    body: ts.factory.createBlock([], false),
  } as ts.FunctionDeclaration;

  let newCode = ts
    .createPrinter({ newLine: ts.NewLineKind.LineFeed })
    .printNode(ts.EmitHint.Unspecified, modifiedFunction, ast);

  return newCode
    .replace(/^function /, "")
    .replace("{ }", "")
    .trim();
}

/**
 * Resolves {@link ...} tags in JSDoc text and converts them to markdown links
 * @param text - The text containing {@link ...} tags
 * @returns Text with {@link ...} tags replaced by markdown links
 */
function resolveLinkTags(text: string): string {
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
    let relativePath;
    if (repoApiLookup.has(apiName)) {
      relativePath = repoApiLookup.get(apiName);
    } else if (typedocLookup.has(apiName)) {
      console.log(
        `Could not find markdown doc, resolved from typedoc docs: {@link ${apiName}}`
      );
      relativePath = typedocLookup.get(apiName);
    }

    if (relativePath) {
      // Convert to markdown link
      let href = relativePath.startsWith("http")
        ? relativePath
        : `../${relativePath}`;
      return `[${description}](${href})`;
    } else {
      // If not found, return as plain text with a warning
      console.warn(
        `Warning: Could not resolve {@link ${apiName}} in documentation`
      );
      return description;
    }
  });
}
