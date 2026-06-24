const fs = require("fs");
const path = require("path");
const https = require("https");

const CIFU_URL =
  "https://raw.githubusercontent.com/gwinterstein/Cifu/master/Lexicon/Cifu-v1.txt";
const OUTPUT_PATH = path.join(__dirname, "../content/reference_top1000.json");

console.log("📥 Downloading Cifu frequency lexicon...");

https
  .get(CIFU_URL, (res) => {
    if (res.statusCode !== 200) {
      console.error(
        `❌ Failed to download Cifu database: Status Code ${res.statusCode}`,
      );
      process.exit(1);
    }

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log("✅ Download complete. Parsing lexicon...");
      parseAndSave(data);
    });
  })
  .on("error", (err) => {
    console.error(`❌ Network error downloading database: ${err.message}`);
    process.exit(1);
  });

function parseAndSave(rawText) {
  const lines = rawText.split("\n");
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split("\t");
    if (parts.length < 13) continue;

    const char = parts[0].trim();
    const jyutping = parts[1].trim();
    const spokenAdultPm = parseFloat(parts[3]);
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
  entries.sort((a, b) => b.frequency_pm - a.frequency_pm);

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
