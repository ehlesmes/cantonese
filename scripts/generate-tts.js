/* global fetch, setTimeout, Buffer */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Premium CLI output styles
const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

// 1. Safe .env Loader
function loadEnv() {
  const envPath = path.resolve(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx !== -1) {
        const k = trimmed.slice(0, eqIdx).trim();
        let v = trimmed.slice(eqIdx + 1).trim();
        // Strip quotes if present
        if (
          (v.startsWith('"') && v.endsWith('"')) ||
          (v.startsWith("'") && v.endsWith("'"))
        ) {
          v = v.slice(1, -1);
        }
        process.env[k] = v;
      }
    }
  }
}

loadEnv();

// 2. Validate Credentials & Fallback Gracefully
const key = process.env.AZURE_SPEECH_KEY;
const region = process.env.AZURE_SPEECH_REGION;

if (!key || !region) {
  console.log(
    `${colors.yellow}${colors.bold}WARNING: Azure Speech credentials missing.${colors.reset}`,
  );
  console.log(
    `${colors.yellow}Please set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION to run the TTS generator.${colors.reset}`,
  );
  console.log(
    `${colors.cyan}Skipping TTS generation and continuing build process...${colors.reset}\n`,
  );
  process.exit(0);
}

// 3. Resolve Paths & Require Parser
const projectRoot = path.resolve(__dirname, "..");
const parserPath = path.resolve(projectRoot, "scripts/lib/parser.js");
const { parseChapter, parseCurriculum } = require(parserPath);

const outputDir = path.resolve(projectRoot, "public/audio/tts");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to strip annotations from Cantonese text
function getCleanSpokenText(text) {
  if (!text) return "";
  let cleaned = text;

  // Replace annotated blocks `Char[Jp|Trans]` with just Char
  const annotationRegex =
    /`?([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`?/g;
  cleaned = cleaned.replace(annotationRegex, (match, char) => char);

  // Clean any lingering bracket parameters
  cleaned = cleaned.replace(/\[[^\]]+\]/g, "");

  return cleaned.trim();
}

// XML Escaper for SSML payload
function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
    }
  });
}

// SHA-256 Hashing helper matching client-side Web Crypto
function getHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

// Promise delay helper
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// REST API synthesiser
async function fetchSpeech(text, subscriptionKey, serviceRegion) {
  const url = `https://${serviceRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

  // Synthesize at standard 1.0x speed. Speed is controlled dynamically on client.
  const ssml = `<speak version='1.0' xml:lang='zh-HK'>
    <voice xml:lang='zh-HK' name='zh-HK-HiuMaanNeural'>
      ${escapeXml(text)}
    </voice>
  </speak>`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": subscriptionKey,
      "Content-Type": "application/ssml+xml",
      "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
      "User-Agent": "cantonese-course",
    },
    body: ssml,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Azure API error (${response.status}): ${detail}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// 4. Main execution
async function main() {
  console.log(
    `${colors.cyan}${colors.bold}=== Starting TTS Generation Pipeline ===${colors.reset}`,
  );

  const spokenTexts = new Set();

  // 4a. Load vocabulary list
  const vocabPath = path.resolve(projectRoot, "content/vocabulary.json");
  if (fs.existsSync(vocabPath)) {
    const vocabList = JSON.parse(fs.readFileSync(vocabPath, "utf8"));
    for (const item of vocabList) {
      if (item.character) {
        const cleanVocab = getCleanSpokenText(item.character);
        if (cleanVocab) spokenTexts.add(cleanVocab);
      }
    }
  }

  // 4b. Load chapters
  const curriculumPath = path.resolve(projectRoot, "content/curriculum.md");
  const chapters = parseCurriculum(curriculumPath);

  for (const chapter of chapters) {
    const filePath = path.resolve(projectRoot, "content", chapter.file);
    if (!fs.existsSync(filePath)) continue;

    const { blocks } = parseChapter(filePath);

    for (const block of blocks) {
      if (block.type === "cantonese") {
        const parts = block.content.split("===");
        const cleanCanto = getCleanSpokenText(parts[0]);
        if (cleanCanto) spokenTexts.add(cleanCanto);
      } else if (block.type === "dialog") {
        const lines = block.content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          const speakerMatch = trimmed.match(/^([A-Za-z]):\s*(.*)$/);
          if (speakerMatch) {
            const rawCantonese = speakerMatch[2].split("===")[0];
            const cleanText = getCleanSpokenText(rawCantonese);
            if (cleanText) spokenTexts.add(cleanText);
          }
        }
      } else if (block.type === "prose") {
        // Prose terms highlighted
        const inlineRegex =
          /`([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]`/g;
        const blockRegex =
          /([\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaffA-Za-z0-9.-]+)\[([^\]\n|]+)\|([^\]\n]+)\]/g;

        let match;
        while ((match = inlineRegex.exec(block.content)) !== null) {
          spokenTexts.add(match[1]);
        }
        while ((match = blockRegex.exec(block.content)) !== null) {
          spokenTexts.add(match[1]);
        }
      }
    }
  }

  // Parse command-line arguments for limit
  const args = process.argv.slice(2);
  let limit = Infinity;
  const limitIdx = args.findIndex((arg) => arg === "--limit" || arg === "-l");
  if (limitIdx !== -1 && args[limitIdx + 1]) {
    limit = parseInt(args[limitIdx + 1], 10);
    if (isNaN(limit)) limit = Infinity;
  }

  const uniqueList = Array.from(spokenTexts);
  console.log(
    `Found ${colors.bold}${uniqueList.length}${colors.reset} unique Cantonese strings to verify.\n`,
  );

  let skippedCount = 0;
  let generatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < uniqueList.length; i++) {
    const text = uniqueList[i];
    const hash = getHash(text);
    const filename = `${hash}.mp3`;
    const filePath = path.resolve(outputDir, filename);

    if (fs.existsSync(filePath)) {
      skippedCount++;
      continue;
    }

    if (generatedCount >= limit) {
      console.log(
        `${colors.yellow}Reached limit of ${limit} generations. Stopping...${colors.reset}`,
      );
      break;
    }

    try {
      console.log(
        `[${i + 1}/${uniqueList.length}] Synthesizing: "${colors.cyan}${text}${colors.reset}"...`,
      );
      const audioBuffer = await fetchSpeech(text, key, region);
      fs.writeFileSync(filePath, audioBuffer);
      generatedCount++;

      // Delay 100ms between calls to stay well within API rate limits
      await delay(100);
    } catch (err) {
      console.error(
        `${colors.red}Failed to generate TTS for "${text}": ${err.message}${colors.reset}`,
      );
      failedCount++;
    }
  }

  console.log(
    `\n${colors.green}${colors.bold}=== TTS Pipeline Completed ===${colors.reset}`,
  );
  console.log(
    `- Cached (skipped): ${colors.bold}${skippedCount}${colors.reset}`,
  );
  console.log(
    `- Synthesized:      ${colors.bold}${generatedCount}${colors.reset}`,
  );
  console.log(
    `- Failed:           ${colors.bold}${failedCount}${colors.reset}`,
  );

  if (failedCount > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}Pipeline crashed:${colors.reset}`, err);
  process.exit(1);
});
