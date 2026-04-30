# Cantonese Learning App: Content & Pedagogical Guidelines

This document defines the standards for creating high-quality, pedagogically sound lessons for the
Cantonese Learning App. All agents and contributors must follow these guidelines.

## 1. The Role of OVERVIEW.md

Every chapter directory (e.g., `data/lessons/1/`) must contain an `OVERVIEW.md` file.

### Goals

- **Source of Truth:** It acts as the master manifest for the chapter's curriculum.
- **Planning Tool:** It must be drafted and approved _before_ any JSON lesson or exercise files are
  created.
- **Audit Log:** It maps every pedagogical concept to its specific explanation and verification
  (exercise).

### Structure

Each lesson in the `OVERVIEW.md` must follow this structure:

1.  **Lesson ID & Name:** (e.g., `Lesson 1.1: Upper Register Tones`)
2.  **Concepts:** Bulleted list of the specific phonetic or grammatical rules taught.
3.  **Examples:** List of Cantonese words/phrases used to illustrate the concepts.
4.  **Exercises:** List of Exercise IDs, their type (Reading/Unscramble), and what they specifically
    test.

## 2. Pedagogical Standards

### Clarity Over Brevity

- Explanations should be conversational but precise.
- Use analogies where helpful (e.g., comparing tones to musical notes or English questioning
  intonation).
- Do not fear length if it adds clarity. A well-explained concept is better than a brief, confusing
  one.

### The "Teach then Test" Rule

- Every concept introduced in an `explanation` page **must** be tested in at least one subsequent
  exercise in that same lesson.
- **Vocabulary Coverage:** If a Cantonese word is used as an example in an explanation, it should
  ideally appear in a practice exercise to reinforce the sound/meaning.
- **Dialogue Flexibility:** Dialogues are permitted to include a small amount of vocabulary that
  hasn't been explicitly taught, provided the meaning can be clearly inferred from the translation
  and context. This flexibility does **not** apply to new grammatical concepts or structures, which
  must always be taught first.

### Vocabulary Organization

- Core lesson concepts, even if they are vocabulary, should remain within the main section of the
  explanation to ensure they are presented in their proper pedagogical context.
- Vocabulary that is not related to the core of the lesson, for example introduced to provide
  context for exercises or dialogs, should be grouped as a **Vocabulary** title at the end of the
  explanation content.
- This maintains a clean focus on the main grammar lesson while providing a dedicated space for
  reinforcing necessary peripheral terms.

### High-Frequency Vocabulary

- Prioritize practical, everyday words over abstract examples, even when teaching pronunciation
  (Chapter 1).
- Avoid using words just for their phonetic value if they are rarely used in conversation.

### Avoid Rote Memorization

- Do not introduce complex sentences or phrases if the underlying grammar (e.g., particles,
  possessives) has not yet been taught.
- Keep early lessons focused on structural building blocks.

### Isolate Grammar Pillars

- Give foundational grammatical concepts (like the possessive `ge3`) their own dedicated lessons
  rather than grouping them with other particles.
- This ensures the student masters the structural impact of the grammar before moving on.

### Vocabulary Recycling

- Intentionally re-use nouns and verbs from earlier chapters in later exercises.
- This builds a compounding vocabulary web and reinforces long-term retention.

### Focus on Conceptual Units

- While each page should ideally focus on a single primary concept, closely related sub-concepts
  (e.g., a set of pronouns or contrasting tones) may be grouped together to provide context.
- The goal is coherence—if a page introduces multiple items, ensure the subsequent exercises verify
  each one without overwhelming the student.

### Exercise Types and Engagement

- **Reading Exercises:** Keep these short (typically 2-3 Cantonese characters). Best for vocabulary,
  short phrases, set expressions, or things that require memorization (e.g., "one, two, three", "my
  book", "our mother"). **Every reading exercise must make conceptual sense**; do not arbitrarily
  group unrelated characters just to meet vocabulary coverage.
- **Unscramble Exercises:** Use these for testing word order, more complex expressions, full
  sentences (e.g., "This is my mother, and that is her book"), or differentiating concepts. **Every
  unscramble exercise must make conceptual sense** and be a coherent phrase or sentence; do not use
  them as a random collection of characters. **All characters used must have been previously
  introduced in an explanation page.**
- **Pronunciation Exception:** In lessons explicitly teaching pronunciation (e.g., Chapter 1),
  exercises may test unrelated characters to focus on sound/tone differentiation. However, these
  exercises must still be kept very short (around 3 characters).
- Each explanation page must be followed by one or more **Reading exercises** and one or more
  **Unscramble exercises**.
- This ensures that every concept introduced is immediately and thoroughly verified. Multiple
  exercises are encouraged if the concept requires diverse testing.
- For introductory pages that do not introduce new Cantonese characters, consider merging them with
  the first conceptual page to maintain this rhythm.

### The "Formal vs. Informal" Balance

- When applicable, chapters should cover both formal and colloquial expressions and vocabulary.
- When teaching about social interactions, lessons must include **both a formal and an informal
  dialogue** to show the contrast in particle usage and vocabulary (e.g., `你好` vs. `點呀？`).
- The lesson should help studends understand not just _what_ to say, but _when_ to say it.

## 3. Agent Self-Critique Prompt

Before finalizing any lesson content, agents should run this self-critique:

> "I have generated the content for [Lesson X]. I will now evaluate it against the following
> criteria:
>
> 1. **Pedagogical Flow:** Does the lesson build logically from the previous one?
> 2. **Concept/Exercise Mapping:** Is every concept taught in the explanation actually tested in an
>    exercise? (e.g., if I taught Tone 4, is there an exercise specifically for Tone 4?)
> 3. **Clarity:** Would a person with zero Cantonese knowledge understand this explanation?
> 4. **Accuracy:** Do the Jyutping romanizations match the Cantonese characters perfectly, and is
>    the English translation semantically correct and natural? (e.g., `siu2 ze2` for 小姐,
>    translated as "Miss")
> 5. **Formatting:** Is all Jyutping romanization **entirely lowercase**? (e.g., `aa3 ming4`, not
>    `Aa3 Ming4`).
> 6. **JSON Schema:** Does the JSON adhere strictly to the schema (no extra fields, correct types)?

If any answer is "No," the agent must iterate on the content before submitting.
