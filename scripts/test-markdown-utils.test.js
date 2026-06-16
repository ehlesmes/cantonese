import { describe, test, expect } from "vitest";
import { compileMarkdown, compileAnnotations } from "../src/utils/markdown.js";

describe("Markdown & Tooltip Compiling Utility", () => {
  test("compileMarkdown should parse standard bold and headers", () => {
    const raw = "# Hello\nThis is **bold** text.";
    const html = compileMarkdown(raw);
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  test("compileMarkdown should convert inline annotations inside backticks to HTML tooltips", () => {
    const raw = "The greeting is `你好[nei5hou2|hello]` in Cantonese.";
    const html = compileMarkdown(raw);
    expect(html).toContain(
      '<span class="vocab-term">你好<span class="tooltip-popover"><strong>nei5hou2</strong><br/>hello</span></span>',
    );
    expect(html).not.toContain("`你好");
  });

  test("compileMarkdown should support inline compilation without wrapping in paragraph tags", () => {
    const raw = "The greeting is `你好[nei5hou2|hello]` in Cantonese.";
    const html = compileMarkdown(raw, { inline: true });
    expect(html).toContain(
      '<span class="vocab-term">你好<span class="tooltip-popover"><strong>nei5hou2</strong><br/>hello</span></span>',
    );
    expect(html).not.toContain("<p>");
    expect(html).not.toContain("</p>");
  });

  test("compileAnnotations should convert block annotations without backticks", () => {
    const raw = "唔該[m4goi1|excuse me]，我[ngo5|I]想買呢個。";
    const html = compileAnnotations(raw);
    expect(html).toContain(
      '<span class="vocab-term">唔該<span class="tooltip-popover"><strong>m4goi1</strong><br/>excuse me</span></span>',
    );
    expect(html).toContain(
      '<span class="vocab-term">我<span class="tooltip-popover"><strong>ngo5</strong><br/>I</span></span>',
    );
  });

  test("compileAnnotations should not affect text without annotations", () => {
    const raw = "Excuse me, I want to buy this one.";
    const html = compileAnnotations(raw);
    expect(html).toBe(raw);
  });
});
