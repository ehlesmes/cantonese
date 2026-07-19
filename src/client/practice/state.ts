import {
  getUnlockedChapters,
  getVocabSRS,
  saveVocabSRS,
  getPhraseSRS,
  savePhraseSRS,
} from "../sys/storage.js";
import { PracticeSession } from "../../utils/practice-session.js";
import type {
  ClientVocab,
  ClientExample,
  SrsStateMap,
} from "../../types/index.js";

export type PracticeItem = ClientVocab | ClientExample;

export const state = {
  allVocab: [] as ClientVocab[],
  allPhrases: [] as ClientExample[],
  unlockedChapters: [] as string[],
  vocabSrsState: {} as SrsStateMap,
  phraseSrsState: {} as SrsStateMap,
  session: null as PracticeSession<PracticeItem> | null,
  assembledTokenIndices: [] as number[],
  currentGroupMode: "chapter" as "chapter" | "level",
  currentTabMode: "vocab" as "vocab" | "phrase",
};

export function loadState() {
  state.unlockedChapters = getUnlockedChapters();
  state.vocabSrsState = getVocabSRS();
  state.phraseSrsState = getPhraseSRS();
}

export function saveState() {
  saveVocabSRS(state.vocabSrsState);
  savePhraseSRS(state.phraseSrsState);
}

export function getCombinedSrsState(): SrsStateMap {
  return { ...state.vocabSrsState, ...state.phraseSrsState };
}
