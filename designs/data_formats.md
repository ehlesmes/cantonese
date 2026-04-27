# Design: Exercise and Lesson Data Formats

## 1. Lesson Manifest (`data/lessons.json`)

The high-level structure defining chapters and their lessons.

```json
{
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

The manifest that defines the order of pages and contains inlined explanations.

```json
[
  {
    "type": "explanation",
    "pageId": "1.1.1",
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
  { "type": "reading", "pageId": "1.1.2" },
  { "type": "unscramble", "pageId": "1.1.3" },
  {
    "type": "congratulations",
    "pageId": "1.1.4",
    "title": "Lesson Complete!",
    "summary": "You've learned basic greetings.",
    "nextLessonId": "1.2"
  }
]
```

## 3. Reading Exercise (`data/exercises/1/1/1.1.2.json`)

Atomic data for a reading practice screen.

```json
{
  "type": "reading",
  "cantonese": "你好嗎？",
  "romanization": "nei5 hou2 maa3?",
  "translation": "How are you?"
}
```

## 4. Unscramble Exercise (`data/exercises/1/1/1.1.3.json`)

Atomic data for a word reordering screen.

```json
{
  "type": "unscramble",
  "tokens": [
    ["我", "ngo5"],
    ["係", "hai6"],
    ["學生", "hok6 saang1"]
  ],
  "translation": "I am a student"
}
```
