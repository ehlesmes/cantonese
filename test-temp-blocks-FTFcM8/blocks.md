---
id: blocks
title: Blocks Chapter
description: Test validation of all block types
---

### Cantonese Block

```cantonese
我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
===
I go to school.
```

### Cantonese Block 2 (unannotated character)

```cantonese
我[ngo5|I] 呀
===
I go
```

### Cantonese Block 3 (Chinese character in English translation)

```cantonese
我[ngo5|I]
===
I 呀
```

### Cantonese Block 4 (invalid Jyutping in example annotation)

```cantonese
我[ngo5-invalid|I]
===
I go
```

### Dialog Block

```dialog
A: 你[nei5|you] 好[hou2|good] 嗎[maa1|interrogative particle]？
=== A: How are you?
B: 我[ngo5|I] 幾[gei2|quite] 好[hou2|good]。
=== B: I am pretty good.
```

### Dialog Block 2 (unannotated character in speaker turn)

```dialog
A: 我[ngo5|I] 呀
=== A: I go
```

### Dialog Block 3 (Chinese character in English translation line)

```dialog
A: 我[ngo5|I]
=== A: I 呀
```

### Dialog Block 4 (invalid speaker prefix)

```dialog
A我[ngo5|I]
=== A: I
```

### Dialog Block 5 (invalid Jyutping in speaker turn)

```dialog
A: 我[ngo5-invalid|I]
=== A: I
```

### Dialog Block 6 (odd number of lines)

```dialog
A: 我[ngo5|I]
=== A: I
B: 你[nei5|you]
```

### Exercise Block 1 (valid)

```exercise
question: 你[nei5|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
explanation: This is an explanation.
```

### Exercise Block 2 (unrecognized key)

```exercise
invalidKey: test
question: 你[nei5|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
explanation: This is an explanation.
```

### Exercise Block 3 (invalid Jyutping in field)

```exercise
question: 你[nei5-invalid|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
explanation: This is an explanation.
```

### Exercise Block 4 (missing required key)

```exercise
question: 你[nei5|you] 去[heoi3|go] 邊度[bin1dou6|where]？
answer: 我[ngo5|I] 去[heoi3|go] 學校[hok6haau6|school]。
```

### Invalid Exercise Block (will trigger parsed YAML error)

```exercise
invalid: content
```
