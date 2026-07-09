import { describe, test, expect } from "vitest";
import path from "path";
import { compileMarkdown, compileAnnotations } from "../src/utils/markdown.js";
import { parseChapter } from "./lib/parser";

describe("HTML Render Snapshot Tests", () => {
  test("Chapter 1 HTML output matches snapshot", () => {
    const filePath = path.resolve(__dirname, "../content/greetings.md");
    const { blocks } = parseChapter(filePath);

    const renderedBlocks = blocks
      .map((block: any) => {
        if (block.type === "prose") {
          return {
            type: "prose",
            html: compileMarkdown(block.content),
          };
        }
        if (block.type === "cantonese" || block.type === "dialog") {
          return {
            type: block.type,
            html: compileAnnotations(block.content),
          };
        }
        return null;
      })
      .filter(Boolean);

    expect(renderedBlocks).toMatchSnapshot();
  });
});

export {};
