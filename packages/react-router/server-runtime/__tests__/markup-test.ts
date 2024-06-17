import vm from "vm";

import { escapeHtml } from "../markup";

describe("escapeHtml", () => {
  // These tests are based on https://github.com/zertosh/htmlescape/blob/3e6cf0614dd0f778fd0131e69070b77282150c15/test/htmlescape-test.js
  // License: https://github.com/zertosh/htmlescape/blob/0527ca7156a524d256101bb310a9f970f63078ad/LICENSE

  test("with angle brackets should escape", () => {
    let evilObj = { evil: "<script></script>" };
    expect(escapeHtml(JSON.stringify(evilObj))).toBe(
      '{"evil":"\\u003cscript\\u003e\\u003c/script\\u003e"}'
    );
  });

  test("with angle brackets should parse back", () => {
    let evilObj = { evil: "<script></script>" };
    expect(JSON.parse(escapeHtml(JSON.stringify(evilObj)))).toMatchObject(
      evilObj
    );
  });

  test("with ampersands should escape", () => {
    let evilObj = { evil: "&" };
    expect(escapeHtml(JSON.stringify(evilObj))).toBe('{"evil":"\\u0026"}');
  });

  test("with ampersands should parse back", () => {
    let evilObj = { evil: "&" };
    expect(JSON.parse(escapeHtml(JSON.stringify(evilObj)))).toMatchObject(
      evilObj
    );
  });

  test('with "LINE SEPARATOR" and "PARAGRAPH SEPARATOR" should escape', () => {
    let evilObj = { evil: "\u2028\u2029" };
    expect(escapeHtml(JSON.stringify(evilObj))).toBe(
      '{"evil":"\\u2028\\u2029"}'
    );
  });

  test('with "LINE SEPARATOR" and "PARAGRAPH SEPARATOR" should parse back', () => {
    let evilObj = { evil: "\u2028\u2029" };
    expect(JSON.parse(escapeHtml(JSON.stringify(evilObj)))).toMatchObject(
      evilObj
    );
  });

  test("escaped line terminators should work", () => {
    expect(() => {
      vm.runInNewContext(
        "(" + escapeHtml(JSON.stringify({ evil: "\u2028\u2029" })) + ")"
      );
    }).not.toThrow();
  });
});
