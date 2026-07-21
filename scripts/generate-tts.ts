import * as fs from "fs";
import * as path from "path";
import { parseChapter, parseCurriculum } from "./lib/parser.js";
import {
  escapeXml,
  getHash,
  extractTTSStrings,
  loadEnv,
  parseArgs,
  type TtsVocabItem,
} from "./lib/tts-utils.js";
import type { ParsedBlock } from "../src/types";

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

// 3. Resolve Paths
const projectRoot = path.resolve(__dirname, "..");
loadEnv(projectRoot);

// Check if TTS generation is explicitly requested to be skipped
if (process.env.SKIP_TTS === "true") {
  console.log(
    `${colors.yellow}TTS generation skipped via SKIP_TTS flag.${colors.reset}\n`,
  );
  process.exit(0);
}

// 2. Validate Credentials & Fallback Gracefully
const key = process.env.AZURE_SPEECH_KEY || "";
const region = process.env.AZURE_SPEECH_REGION || "";

if (!key || region === "") {
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

const outputDir = path.resolve(projectRoot, "public/audio/tts");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Promise delay helper
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// REST API synthesiser
async function fetchSpeech(
  text: string,
  subscriptionKey: string,
  serviceRegion: string,
) {
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

async function generateAudioForStrings(
  uniqueList: string[],
  limit: number,
  outputDir: string,
  key: string,
  region: string,
): Promise<{
  skippedCount: number;
  generatedCount: number;
  failedCount: number;
}> {
  let skippedCount = 0;
  let generatedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < uniqueList.length; i++) {
    const text = uniqueList[i];
    if (text === undefined) continue;

    const hash = await getHash(text);
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

      await delay(100);
    } catch (err: unknown) {
      console.error(
        `${colors.red}Failed to generate TTS for "${text}": ${(err as Error).message}${colors.reset}`,
      );
      failedCount++;
    }
  }

  return { skippedCount, generatedCount, failedCount };
}

// 4. Main execution
async function main() {
  console.log(
    `${colors.cyan}${colors.bold}=== Starting TTS Generation Pipeline ===${colors.reset}`,
  );

  const args = process.argv.slice(2);
  const { limit, maxChapters } = parseArgs(args);

  const vocabPath = path.resolve(projectRoot, "content/vocabulary.json");
  let vocabList: TtsVocabItem[] = [];
  if (fs.existsSync(vocabPath)) {
    vocabList = JSON.parse(
      fs.readFileSync(vocabPath, "utf8"),
    ) as TtsVocabItem[];
  }

  const curriculumPath = path.resolve(projectRoot, "content/curriculum.md");
  const currContent = fs.readFileSync(curriculumPath, "utf8");
  const chapters = parseCurriculum(currContent);

  let chaptersProcessed = 0;
  const chaptersData: { id: string; file: string; blocks: ParsedBlock[] }[] =
    [];

  for (const chapter of chapters) {
    if (chaptersProcessed >= maxChapters) break;

    const filePath = path.resolve(projectRoot, "content", chapter.file);
    if (!fs.existsSync(filePath)) continue;

    chaptersProcessed++;
    const chapterContent = fs.readFileSync(filePath, "utf8");
    const { blocks } = parseChapter(chapterContent);
    chaptersData.push({
      id: chapter.id,
      file: chapter.file,
      blocks: blocks as ParsedBlock[],
    });
  }

  const uniqueList = extractTTSStrings(
    chaptersData,
    vocabList,
    maxChapters === Infinity,
  );

  console.log(
    `Found ${colors.bold}${uniqueList.length}${colors.reset} unique Cantonese strings to verify.\n`,
  );

  const { skippedCount, generatedCount, failedCount } =
    await generateAudioForStrings(uniqueList, limit, outputDir, key, region);

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

main().catch((err: unknown) => {
  console.error(`${colors.red}Pipeline crashed:${colors.reset}`, err);
  process.exit(1);
});

export {};
