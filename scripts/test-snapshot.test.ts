import { describe, test, expect } from "vitest";
import path from "path";
import fs from "fs";
import { compileMarkdown, compileAnnotations } from "../src/utils/markdown.js";
import { parseChapter } from "./lib/parser";

describe("HTML Render Snapshot Tests", () => {
  test("Chapter 1 HTML output matches snapshot", async () => {
    const filePath = path.resolve(__dirname, "../content/greetings.md");
    const content = fs.readFileSync(filePath, "utf8");
    const { blocks } = parseChapter(content);

    const renderedBlocks = (
      await Promise.all(
        blocks.map(async (block: { type: string; content: string }) => {
          if (block.type === "prose") {
            return {
              type: "prose",
              html: await compileMarkdown(block.content),
            };
          }
          if (block.type === "cantonese" || block.type === "dialog") {
            return {
              type: block.type,
              html: await compileAnnotations(block.content),
            };
          }
          return null;
        }),
      )
    ).filter(Boolean);

    expect(renderedBlocks).toMatchSnapshot();
  });
});

export {};
