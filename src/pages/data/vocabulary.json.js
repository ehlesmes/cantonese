import fs from "fs";
import path from "path";
import { createRequire } from "module";

const cjsRequire = createRequire(import.meta.url);
const parserPath = path.resolve(process.cwd(), "scripts/lib/parser.js");
const { parseCurriculum } = cjsRequire(parserPath);

export async function GET() {
  const curriculumPath = path.resolve("content/curriculum.md");
  const chapters = parseCurriculum(curriculumPath);

  const chaptersMeta = chapters.map((c, index) => {
    const fileExists = fs.existsSync(path.resolve("content", c.file));
    return {
      id: c.id,
      chapterNumber: index,
      title: c.title,
      exists: fileExists,
    };
  });

  const vocabPath = path.resolve("content/vocabulary.json");
  const allVocabRaw = JSON.parse(fs.readFileSync(vocabPath, "utf8"));

  const allVocab = allVocabRaw.map((item) => {
    const chMeta = chaptersMeta.find((c) => c.id === item.firstIntroducedIn);
    return {
      id: `vocab-${item.character}_${item.jyutping.replace(/\s+/g, "")}`,
      character: item.character,
      jyutping: item.jyutping,
      translation: item.translation,
      chapter: item.firstIntroducedIn,
      chapterNumber: chMeta ? chMeta.chapterNumber : 0,
      chapterTitle: chMeta ? chMeta.title : "Introduction",
      occurrences: item.occurrences,
    };
  });

  return new Response(JSON.stringify(allVocab), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
