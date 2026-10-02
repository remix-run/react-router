/**
 * Regression coverage for #15558 / #15561: nested template literals containing
 * `/*` must not make dox attach the following JSDoc to the wrong API.
 *
 * Run: node --experimental-strip-types scripts/utils/mask-block-comment-markers.test.ts
 */
import assert from "node:assert/strict";
// @ts-expect-error
import dox from "dox";

import { maskBlockCommentMarkersInStrings } from "./mask-block-comment-markers.ts";

const fixture = `
/**
 * Docs for useRoutes.
 * @public
 * @category Hooks
 */
export function useRoutes() {
  warning(
    \`path="\${parentPath === "/" ? "*" : \`\${parentPath}/*\`}">.\`
  );
  return null;
}

/**
 * Returns the current Navigation.
 * @public
 * @category Hooks
 */
export function useNavigation() {
  return null;
}
`;

function publicDesc(code: string, name: string): string {
  let comments = dox.parseComments(code, { raw: true });
  let match = comments.find((c: any) => c.ctx?.name === name);
  assert.ok(match, `expected dox comment for ${name}`);
  return match.description.full;
}

// Without masking, nested \`\${...}/*\` corrupts useNavigation's description.
let corrupted = publicDesc(fixture, "useNavigation");
assert.match(
  corrupted,
  /return null/,
  "expected unmasked fixture to still reproduce the dox corruption",
);

// With masking, each API keeps its own summary.
let masked = maskBlockCommentMarkersInStrings(fixture);
assert.equal(publicDesc(masked, "useRoutes"), "Docs for useRoutes.");
assert.equal(
  publicDesc(masked, "useNavigation"),
  "Returns the current Navigation.",
);

// Real block comments are preserved for dox.
let withRealComment = `
/**
 * Keep me.
 * @public
 * @category Hooks
 */
export function keep() {
  /* internal */
  return "/* in a string */";
}
`;
let maskedReal = maskBlockCommentMarkersInStrings(withRealComment);
assert.equal(publicDesc(maskedReal, "keep"), "Keep me.");
assert.match(maskedReal, /\/\* internal \*\//);
assert.match(maskedReal, /"\/\u200b\* in a string \*\u200b\/"/);

console.log("mask-block-comment-markers: all assertions passed");
