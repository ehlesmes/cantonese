# Design: Exercise and Explanation Data Formats

## 1. Lesson Map (`data/lessons.json`)

The main index that defines the order of pages in a lesson.

```json
{
  "chapters": [
    {
      "id": "1",
      "name": "Level 1: The Basics",
      "lessons": [
        {
          "id": "1.1",
          "name": "Basic Greetings",
          "pages": [
            { "type": "explanation", "id": "1.1.1" },
            { "type": "reading", "id": "1.1.2" },
            { "type": "unscramble", "id": "1.1.3" }
          ]
        }
      ]
    }
  ]
}
```

## 2. Explanation Bundle (`data/explanations/1.1.json`)

A lesson-level bundle containing all static content chunks for a specific lesson.

```json
{
  "1.1.1": [
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
}
```

## 3. Reading Exercise (`data/exercises/1/1/1.1.2.json`)

Atomic data for a reading practice screen.

```json
{
  "cantonese": "你好嗎？",
  "romanization": "nei5 hou2 maa3?",
  "translation": "How are you?"
}
```

## 4. Unscramble Exercise (`data/exercises/1/1/1.1.3.json`)

Atomic data for a word reordering screen.

```json
{
  "tokens": [
    ["我", "ngo5"],
    ["係", "hai6"],
    ["學生", "hok6 saang1"]
  ],
  "translation": "I am a student"
}
```
