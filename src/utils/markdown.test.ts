import { describe, test, expect } from "vitest";
import { compileMarkdown, compileAnnotations } from "./markdown.js";
import crypto from "crypto";

describe("Markdown & Tooltip Compiling Utility", () => {
  test("compileMarkdown should output correct data-audio-hash matching SHA-256", () => {
    const raw = "The greeting is `你好[nei5hou2|hello]` in Cantonese.";
    const html = compileMarkdown(raw);
    const expectedHash = crypto
      .createHash("sha256")
      .update("你好")
      .digest("hex")
      .slice(0, 16);
    expect(html).toContain(`data-audio-hash="${expectedHash}"`);
  });

  test("compileMarkdown should parse standard bold and headers", () => {
    const raw = "# Hello\nThis is **bold** text.";
    const html = compileMarkdown(raw);
    expect(html).toContain("<h1>Hello</h1>");
    expect(html).toContain("<strong>bold</strong>");
  });

  test("compileMarkdown should convert inline annotations inside backticks to HTML tooltips with data-audio-hash", () => {
    const raw = "The greeting is `你好[nei5hou2|hello]` in Cantonese.";
    const html = compileMarkdown(raw);
    expect(html).toContain(
      '你好<span class="tooltip-popover"><strong>nei5hou2</strong><br/>hello</span></span>',
    );
    expect(html).toMatch(/data-audio-hash="[0-9a-f]{16}"/);
    expect(html).not.toContain("`你好");
  });

  test("compileMarkdown should support inline compilation without wrapping in paragraph tags", () => {
    const raw = "The greeting is `你好[nei5hou2|hello]` in Cantonese.";
    const html = compileMarkdown(raw, { inline: true });
    expect(html).toContain(
      '你好<span class="tooltip-popover"><strong>nei5hou2</strong><br/>hello</span></span>',
    );
    expect(html).toContain('data-audio-hash="');
    expect(html).not.toContain("<p>");
    expect(html).not.toContain("</p>");
  });

  test("compileMarkdown should support breaks option to preserve line breaks", () => {
    const raw = "Line 1\nLine 2";
    const html = compileMarkdown(raw, { breaks: true });
    expect(html).toContain("<br>");
  });

  test("compileMarkdown should support English alphanumeric and punctuated words as Cantonese terms", () => {
    const raw =
      "I check my `IG[ai1zi1|Instagram]` and connect to `Wi-Fi[wai1faai1|Wi-Fi]`. Let's `OT[ou1ti1|overtime]`.";
    const html = compileMarkdown(raw);
    expect(html).toContain(
      'IG<span class="tooltip-popover"><strong>ai1zi1</strong><br/>Instagram</span></span>',
    );
    expect(html).toContain(
      'Wi-Fi<span class="tooltip-popover"><strong>wai1faai1</strong><br/>Wi-Fi</span></span>',
    );
    expect(html).toContain(
      'OT<span class="tooltip-popover"><strong>ou1ti1</strong><br/>overtime</span></span>',
    );
  });

  test("compileAnnotations should convert block annotations without backticks", () => {
    const raw = "唔該[m4goi1|excuse me]，我[ngo5|I]想買呢個。";
    const html = compileAnnotations(raw);
    expect(html).toContain(
      '唔該<span class="tooltip-popover"><strong>m4goi1</strong><br/>excuse me</span></span>',
    );
    expect(html).toContain(
      '我<span class="tooltip-popover"><strong>ngo5</strong><br/>I</span></span>',
    );
    expect(html).toContain('data-audio-hash="');
  });

  test("compileMarkdown should replace plain block annotations (without backticks)", () => {
    const raw = "The greeting is 你好[nei5hou2|hello] in Cantonese.";
    const html = compileMarkdown(raw);
    expect(html).toContain(
      '你好<span class="tooltip-popover"><strong>nei5hou2</strong><br/>hello</span></span>',
    );
    expect(html).toMatch(/data-audio-hash="[0-9a-f]{16}"/);
  });

  test("compileAnnotations should not affect text without annotations", () => {
    const raw = "Excuse me, I want to buy this one.";
    const html = compileAnnotations(raw);
    expect(html).toBe(raw);
  });

  test("compileAnnotations should handle null or empty inputs gracefully", () => {
    expect(compileAnnotations(null)).toBe("");
    expect(compileAnnotations(undefined)).toBe("");
    expect(compileAnnotations("")).toBe("");
  });

  test("compileMarkdown should support simple single-paragraph blockquote alerts", () => {
    const raw = "> [!NOTE]\n> This is a note.";
    const html = compileMarkdown(raw);
    expect(html).toContain('<div class="alert-box alert-note">');
    expect(html).toContain('<div class="alert-title">NOTE</div>');
    expect(html).toContain(
      '<div class="alert-content"><p>This is a note.</p></div>',
    );
  });

  test("compileMarkdown should support multi-paragraph and list elements nested inside blockquote alerts", () => {
    const raw =
      "> [!IMPORTANT] **Alert Header**\n> Rest of sentence.\n>\n> - List Item 1\n> - List Item 2";
    const html = compileMarkdown(raw);
    expect(html).toContain('<div class="alert-box alert-important">');
    expect(html).toContain('<div class="alert-title">IMPORTANT</div>');
    expect(html).toContain(
      "<p><strong>Alert Header</strong>\nRest of sentence.</p>",
    );
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>List Item 1</li>");
  });
});

export {};
