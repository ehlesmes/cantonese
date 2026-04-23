# Design: Exercise and Explanation Data Formats

## 1. Lesson Map (`data/lessons.json`)
The main index that defines the order of pages in a lesson.

```json
{
  "lesson_id": "L1",
  "name": "Basic Greetings",
  "chapter": "1",
  "lesson_number": "1",
  "pages": [
    { "type": "explanation", "id": "intro_hello" },
    { "type": "reading", "id": "read_hello" },
    { "type": "unscramble", "id": "unscramble_hello" }
  ]
}
```

## 2. Explanation Bundle (`data/explanations/<lesson_id>.json`)
A lesson-level bundle containing all static content chunks for a specific lesson.

```json
{
  "intro_hello": [
    { "type": "title", "value": "Saying Hello" },
    { "type": "text", "value": "In Cantonese, we use <strong>你好</strong> to greet people." },
    { 
      "type": "example", 
      "cantonese": "你好。", 
      "romanization": "nei5 hou2.", 
      "translation": "Hello." 
    }
  ]
}
```

## 3. Reading Exercise (`data/exercises/<chapter>/<lesson>/<id>.json`)
Atomic data for a reading practice screen.

```json
{
  "cantonese": "你好嗎？",
  "romanization": "nei5 hou2 maa3?",
  "translation": "How are you?"
}
```

## 4. Unscramble Exercise (`data/exercises/<chapter>/<lesson>/<id>.json`)
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
