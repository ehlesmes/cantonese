import fs from "fs";
import path from "path";
import { parseCurriculum } from "../../../scripts/lib/parser";
import { getStableVocabId } from "../../utils/text";
import type { APIRoute } from "astro";

interface CurriculumChapter {
  id: string;
  file: string;
  title: string;
}

interface VocabItem {
  character: string;
  jyutping: string;
  translation: string;
  firstIntroducedIn: string;
  occurrences: string[];
}

export const GET: APIRoute = async () => {
  const curriculumPath = path.resolve("content/curriculum.md");
  const curriculumContent = fs.readFileSync(curriculumPath, "utf8");
  const chapters = parseCurriculum(curriculumContent);

  const chaptersMeta = (chapters as unknown as CurriculumChapter[]).map(
    (c, index: number) => {
      const fileExists = fs.existsSync(path.resolve("content", c.file));
      return {
        id: c.id,
        chapterNumber: index,
        title: c.title,
        exists: fileExists,
      };
    },
  );

  const vocabPath = path.resolve("content/vocabulary.json");
  const allVocabRaw = JSON.parse(
    fs.readFileSync(vocabPath, "utf8"),
  ) as unknown as VocabItem[];

  const allVocab = allVocabRaw.map((item) => {
    const chMeta = chaptersMeta.find((c) => c.id === item.firstIntroducedIn);
    return {
      id: getStableVocabId(item.character, item.jyutping),
      practiceType: "vocab",
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
};
