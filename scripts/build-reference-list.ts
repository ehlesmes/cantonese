import * as fs from "fs";
import * as path from "path";
import * as https from "https";

const CIFU_URL =
  "https://raw.githubusercontent.com/gwinterstein/Cifu/master/Lexicon/Cifu-v1.txt";
const OUTPUT_PATH = path.join(__dirname, "../content/reference_top1000.json");

console.log("📥 Downloading Cifu frequency lexicon...");

https
  .get(CIFU_URL, (res: import("http").IncomingMessage) => {
    if (res.statusCode !== 200) {
      console.error(
        `❌ Failed to download Cifu database: Status Code ${res.statusCode}`,
      );
      process.exit(1);
    }

    let data = "";
    res.on("data", (chunk: Buffer) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("✅ Download complete. Parsing lexicon...");
      parseAndSave(data);
    });
  })
  .on("error", (err: Error) => {
    console.error(`❌ Network error downloading database: ${err.message}`);
    process.exit(1);
  });

function parseAndSave(rawText: string) {
  const lines = rawText.split("\n");
  const entries: any[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    if (rawLine === undefined) continue;
    const line = rawLine.trim();
    if (!line) continue;

    const parts = line.split("\t");
    if (parts.length < 13) continue;

    const part0 = parts[0];
    const part1 = parts[1];
    const part5 = parts[5];
    if (part0 === undefined || part1 === undefined || part5 === undefined) continue;

    const char = part0.trim();
    const jyutping = part1.trim();
    const spokenAdultPm = parseFloat(part5);
    const translation = parts[12] ? parts[12].trim() : "";

    // Skip empty entries or system codes
    if (!char || !jyutping || isNaN(spokenAdultPm)) continue;

    // Filter out punctuation-like characters or non-Chinese characters
    if (/^[^\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]+$/.test(char)) continue;

    entries.push({
      char,
      jyutping,
      frequency_pm: spokenAdultPm,
      translation,
    });
  }

  // Sort by frequency per million in descending order
  entries.sort((a: any, b: any) => b.frequency_pm - a.frequency_pm);

  // Take the top 1000 unique entries (avoiding duplicate characters)
  const uniqueEntries = [];
  const seenChars = new Set();

  for (const entry of entries) {
    if (seenChars.has(entry.char)) continue;
    seenChars.add(entry.char);

    uniqueEntries.push({
      rank: uniqueEntries.length + 1,
      char: entry.char,
      jyutping: entry.jyutping,
      frequency_pm: Math.round(entry.frequency_pm * 100) / 100,
      translation: entry.translation,
    });

    if (uniqueEntries.length === 1000) break;
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(uniqueEntries, null, 2), "utf8");
  console.log(
    `🎉 Success! Saved the top ${uniqueEntries.length} most common spoken Cantonese words to "${OUTPUT_PATH}"`,
  );
}

export {};
