# Cantonese Course Content Specification

This document defines the file structure and the custom Markdown syntax
extension used for writing Colloquial Cantonese chapters. The format is designed
to be highly readable for authors, clean for LLM generation, and easily parsed
into interactive UI elements (such as word-by-word hover definitions and
toggleable exercise answers).

---

## 1. Directory & File Naming Conventions

All chapter files are located in the `content/` directory. Files must be named
with two-digit prefixes to maintain correct chapter sorting:

```
content/
├── README.md                # This specification
├── 01-greetings.md          # First chapter
├── 02-shopping-money.md     # Second chapter
└── ...
```

---

## 2. Frontmatter Metadata

Each chapter file must begin with a YAML frontmatter block containing metadata
about the chapter:

```markdown
---
chapter: 1
title: Greetings & Courtesy
description:
  Learn how to say hello, thank people, and apologize in daily situations.
---
```

---

## 3. Inline Semantic Vocabulary Units

When discussing vocabulary words or expressions inline within regular
explanations, use the custom semantic annotation bracket format:

```markdown
`Characters[Jyutping|Translation]`
```

### Examples

- The basic greeting in Cantonese is `你好[nei5hou2|hello]`.
- To ask for service or say thank you for help, use
  `唔該[m4goi1|excuse me / please / thank you]`.

### Formatting Rules

1. **Characters**: Written in **Traditional Chinese**, which is standard for
   Cantonese.
2. **Jyutping**: LSHK Jyutping standard romanization with tone numbers 1 to 6
   (no spaces inside a single multi-character word unless it's a natural
   division).
3. **Translation**: A concise English translation of the semantic unit.
4. **Markdown backticks**: The entire unit must be wrapped in backticks
   (`` ` ``) to distinguish it from plain text and render nicely in default
   markdown viewers.

---

## 4. Cantonese Example Sentence Blocks

To present full example sentences with their translation as a whole alongside
semantic word-by-word breakdowns, use the `cantonese` code block language.
Separate the Cantonese annotated sentence and the English translation using a
line containing exactly `===`.

````markdown
```cantonese
唔該[m4goi1|excuse me]，我[ngo5|I]想[soeng2|want to]買[maai5|buy]呢個[ni1go3|this one]。
===
Excuse me, I want to buy this one.
```
````

### Rules

1. The block must be tagged as `cantonese`.
2. The Cantonese line must use inline annotations for each semantic unit.
   Punctuation (`，`, `。`, `？`, `！`) should be kept outside the annotation
   brackets.
3. The separator `===` must be on its own line.
4. The English translation of the entire sentence must follow the separator.

---

## 5. Dialogue Blocks

For conversational practice and situational dialogues, use the `dialog` code
block. Dialogues consist of speaker turns, with each turn having both the
Cantonese annotated line and its corresponding English translation:

````markdown
```dialog
A: 唔該[m4goi1|excuse me]，我[ngo5|I]想[soeng2|want to]買[maai5|buy]呢個[ni1go3|this one]。
   === Excuse me, I want to buy this one.
B: 好啊[hou2aa3|sure]，呢個[ni1go3|this one]三十[saam1sap6|thirty]蚊[man1|dollars]。
   === Sure, this one is thirty dollars.
```
````

### Rules

1. The block must be tagged as `dialog`.
2. Each speaker's Cantonese line starts with a letter and a colon (e.g., `A: `,
   `B: `).
3. The English translation of the line is placed immediately below, prefixed
   with `=== `.

---

## 6. Exercise Blocks

Exercises are optional, can appear anywhere in the chapter, and must be
formatted using YAML within an `exercise` code block. To ensure maximum
flexibility for LLMs and simple parsing, each exercise must strictly contain
only three fields:

- `question`: The instruction or question to be answered (including options or
  blank lines if applicable).
- `answer`: The correct response (formatted with Cantonese inline semantic
  syntax if applicable).
- `explanation`: A clear explanation of why this answer is correct and any
  relevant grammatical details.

### Multiple-Choice Exercise Example

````markdown
```exercise
question: |
  Which of the following is the most natural way to say "Thank you" when someone gives you a gift?
  A) 唔該[m4goi1|excuse me / thank you for service]
  B) 多謝[do1ze6|thank you for a gift]
  C) 唔使客氣[m4sai2 haak3hei3|you are welcome]
answer: B
explanation: 多謝[do1ze6|thank you for a gift] is used for gifts, compliments, or concrete favors. 唔該[m4goi1|excuse me / thank you for service] is reserved for services or help.
```
````

### Fill-in-the-Blank Exercise Example

````markdown
```exercise
question: |
  Fill in the blank with the correct verb for "to eat":
  我[ngo5|I]想[soeng2|want to] ____ 點心[dim2sam1|dim sum]。
answer: 食[sik6|to eat]
explanation: 食[sik6|to eat] is the colloquial Cantonese verb for "to eat" (equivalent to Mandarin 吃 chī).
```
````

### Free Translation Exercise Example

````markdown
```exercise
question: Translate "Excuse me, I want to buy this one." into Cantonese.
answer: 唔該[m4goi1|excuse me]，我[ngo5|I]想[soeng2|want to]買[maai5|buy]呢個[ni1go3|this one]。
explanation: 唔該[m4goi1|excuse me] is used for "excuse me", 我[ngo5|I] is "I", 想[soeng2|want to] is "want to", 買[maai5|buy] is "buy", and 呢個[ni1go3|this one] is "this one".
```
````

---

## 7. Linguistic & Formatting Standards

1. **Colloquial and Spoken Focus**: Avoid formal written Chinese vocabulary
   (e.g. 書面語). Prioritize everyday spoken terms (e.g., use `佢[keoi5|he/she]`
   instead of `他`, `靚[leng3|pretty]` instead of `漂亮`, `喺[hai2|at/in]`
   instead of `在`).
2. **Jyutping Accuracy**: Double-check all tones (1-6). Ensure compound words
   like `呢個[ni1go3]` are represented as single units (no spaces in
   romanization) to keep hover annotations clear.
3. **Colloquial Tone Changes (變音, bin3jam1)**: Write the **actual spoken
   tone** directly in the Jyutping (e.g., write `糖[tong2|candy]` with tone 2,
   even though the base dictionary character `糖` is `tong4`). This ensures the
   learner acquires natural spoken pronunciation immediately.
4. **Translation Styles**:
   - For overall sentences (under the `===` separator), use **natural colloquial
     English** so the learner understands the true meaning of the sentence.
   - For individual inline semantic units, use **literal/contextual
     translations** inside the bracket brackets to convey structural meanings.

---

## 8. Chapter Organization & Course Progression

1. **Course Introduction (`00-pronunciation-jyutping.md`)**: The very first file
   in the course acts as a dedicated introduction to the Jyutping system,
   consonants, vowels, and the 6 tones. Subsequent chapters do not need to
   re-introduce these mechanical foundations and can focus entirely on language
   content.
2. **Flexible, Free-Form Chapter Layout**: Chapters do not have a rigid,
   identical layout structure. Authors/LLMs are encouraged to structure each
   chapter dynamically based on what best suits the topic. For example:
   - Grammatically complex chapters can prioritize tabular explanations and
     targeted examples.
   - Social chapters can lead with multiple rich situational dialogues.
   - All chapters must include a mix of clear, thorough prose explanations,
     practical examples, and concluding exercises.
3. **Tone & Style**: Keep explanations highly encouraging, practical, and
   conversational. Break complex concepts into small, digestible units with
   clear headings.
