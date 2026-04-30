# Design: Exercise and Lesson Data Formats

This document serves as the primary source of truth for the JSON data structures used in the app.
For programmatic validation rules, see `schemas/`.

## 1. Lesson Manifest (`data/lessons.json`)

The high-level structure defining chapters and their lessons.

```json
{
  "version": 1,
  "chapters": [
    {
      "chapterId": "1",
      "chapterName": "Chapter 1: The Basics",
      "lessons": [{ "lessonId": "1.1", "lessonName": "Basic Greetings" }]
    }
  ]
}
```

## 2. Lesson Detail (`data/lessons/1/1.1.json`)

The manifest that defines the order of pages and contains inlined explanations and dialogues.

```json
{
  "version": 1,
  "pages": [
    {
      "type": "explanation",
      "content": [
        { "type": "title", "value": "Saying Hello" },
        {
          "type": "text",
          "value": "In Cantonese, we use <strong>你好</strong> to greet people."
        },
        {
          "type": "example",
          "cantonese": "你好。",
          "romanization": "nei5 hou2.",
          "translation": "Hello."
        }
      ]
    },
    { "type": "reading", "exerciseId": "1.1.2" },
    { "type": "unscramble", "exerciseId": "1.1.3" },
    {
      "type": "dialog",
      "lines": [
        {
          "speaker": "A",
          "cantonese": "你好！",
          "romanization": "nei5 hou2!",
          "translation": "Hello!"
        },
        {
          "speaker": "B",
          "cantonese": "你好嗎？",
          "romanization": "nei5 hou2 maa3?",
          "translation": "How are you?"
        }
      ]
    },
    {
      "type": "congratulations",
      "title": "Lesson Complete!",
      "summary": "You've learned basic greetings.",
      "nextLessonId": "1.2"
    }
  ]
}
```

## 3. Dialogue Page Schema

A dialogue page consists of a list of dialogue lines between speakers.

```json
{
  "type": "dialog",
  "lines": [
    {
      "speaker": "Speaker Name",
      "cantonese": "Cantonese Text",
      "romanization": "Jyutping",
      "translation": "English Translation"
    }
  ]
}
```

## 4. Reading Exercise (`data/exercises/1/1/1.1.2.json`)

Atomic data for a reading practice screen.

```json
{
  "version": 1,
  "type": "reading",
  "cantonese": "你好嗎？",
  "romanization": "nei5 hou2 maa3?",
  "translation": "How are you?"
}
```

## 5. Unscramble Exercise (`data/exercises/1/1/1.1.3.json`)

Atomic data for a word reordering screen.

```json
{
  "version": 1,
  "type": "unscramble",
  "tokens": [
    ["我", "ngo5"],
    ["係", "hai6"],
    ["學生", "hok6 saang1"]
  ],
  "translation": "I am a student"
}
```

## 6. Local Storage Progress (`cantonese_progress`)

Stored in `localStorage` under the key `cantonese_progress`.

```json
{
  "version": 1,
  "lessons": {
    "1.1": {
      "lastPageIndex": 2,
      "completed": true
    }
  },
  "practice": {
    "levels": {
      "1": ["1/1/1.1.2.json"],
      "2": ["1/1/1.1.3.json"],
      "3": [],
      "4": [],
      "5": [],
      "6": [],
      "7": [],
      "8": [],
      "9": [],
      "10": []
    }
  }
}
```

- **`version`**: Schema version for future migrations.
- **`lessons`**: Map of `lessonId` to user progress.
- **`practice.levels`**: SRS levels (1-10). Each contains an array of exercise paths relative to
  `data/exercises/`.
