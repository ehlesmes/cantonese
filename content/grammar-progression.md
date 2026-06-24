# Colloquial Cantonese Course: Curriculum Specification & Grammar Progression

This document defines the core pedagogical specification, design motivation, and
chapter-by-chapter mapping for the Colloquial Cantonese Course. It outlines the
transition from a grammar-first spoken foundation to high-density situational
mastery, designed to build a vocabulary of 1,000–2,000 high-frequency terms.

---

## 1. Pedagogical Philosophy & Motivation

The course structure is built on five core principles designed to balance
syntactic rigor with natural spoken acquisition:

### A. Grammar & Concept Priming

Many language courses fall into one of two extremes: academic grammar guides
(too abstract, robotic) or phrasebooks (no underlying logic, hard to
generalize).

- **Our Approach**: We introduce core syntax, pronouns, negation, and particles
  immediately in the first few chapters. By understanding the structural
  "skeleton" (e.g., word order, question formation, existentials, and aspect
  markers), the student can actively generate original sentences rather than
  memorizing rigid scripts.

### B. Dialogue-First Contextualization

- **The Motivation**: Students should not have to wait for weeks of grammar
  lectures before reading daily dialogue.
- **Our Approach**: Every grammatical concept is introduced _through_ a
  real-life, colloquial dialogue from Chapter 1. The grammar notes explain what
  the student has already seen and spoken in context.

### C. Focus on Spoken (Colloquial) Realism

- **The Motivation**: Standard Written Chinese (書面語 _syu1 min6 jyu5_) differs
  significantly from spoken Cantonese (口語 _hau2 jyu5_). Learners must acquire
  the oral language first to understand natural conversations.
- **Our Approach**: We prioritize colloquial verbs (e.g., `睇` instead of `看`,
  `搵` instead of `找`), contractions (e.g., `咁樣` _gam2 joeng2_), English
  loanwords (e.g., `的士` _dik1si2_), and high-frequency sentence-final
  particles (`呀`, `啦`, `囉`, `咗`).

### D. The Lexical Pivot (Phase 3)

- **The Motivation**: Once the grammatical foundation is laid, repeating complex
  grammatical structures yields diminishing returns for daily communication. The
  primary bottleneck shifts to vocabulary size.
- **Our Approach**: By Chapter 12 (the end of Phase 2), the student will have
  learned 100% of the core sentence structures. From Chapter 13 onwards (Phase
  3), the focus pivots to high-density situational vocabulary (housing, apps,
  finance, health, emergencies), spiraling the grammar learned in Phases 1 & 2.

### E. The 1,000–2,000 Spoken Vocabulary Target via Micro-Learning

- **The Motivation**: While standard spoken fluency requires a 1,500–2,000 word
  lexicon, forcing 35–50 new terms into a single chapter causes severe cognitive
  overload, especially given Cantonese's tones and Jyutping romanization.
- **Our Approach**: We limit each chapter to a highly digestible **15 to 20 new
  vocabulary items**. Because we are not limited by the number of chapters, we
  split broad topics into focused, bite-sized lessons. To reach our 1,500-word
  target, the curriculum scales to **75–100 focused micro-chapters** grouped in
  thematic units. Progress is evaluated against the spoken frequency database
  using `npm run vocab:eval`.

### F. Natural Dialogues & Scaffolding (No Artificial Limits)

- **The Motivation**: Artificially restricting dialogues or examples to _only_
  contain previously taught words produces robotic, wooden language that does
  not represent how native speakers actually talk.
- **Our Approach**: Dialogues and examples are written to be as natural,
  authentic, and idiomatic as possible. We do not artificially throttle or
  censor daily expressions. Instead, we use our **word-by-word hover
  annotations** (`Char[Jyutping|Translation]`) to provide scaffolding for any
  words beyond the target vocabulary list. This exposes learners to rich,
  natural input while ensuring they are never lost.

---

## 2. Chapter-by-Chapter Specification & Rationale

### Phase 1: Foundational Grammar & Spoken Anchors (Chapters 00–06)

_Phase Goal: Establish basic sentence structure, questions, negation,
existentials, location, and scheduling using only high-frequency vocabulary._

#### Chapter 00: Pronunciation & Jyutping Fundamentals (`00-pronunciation-jyutping.md`)

- **Syntactic Goal**: Tone contours (1-6), consonant stops (`-p`, `-t`, `-k`),
  and vowel length (`aa` vs `a`).
- **Situational Context**: Ear training and initial pronunciation drills.
- **Vocabulary Target**: 10 words. High-frequency spoken exclamations (`喂`
  _wai2_ | Hey!, `吓` _haa2_ | What?).
- **Rationale**: Exclamations allow students to practice pitch contours on
  short, natural utterances before tackling complex sentences.

#### Chapter 01: Identity & Core Questions (`01-greetings.md`)

- **Syntactic Goal**: Word order, Pronouns (`我/你/佢` & plural suffix `哋`),
  equative verb (`係`), negation prefix (`唔` _m4_), softening particle (`呀`
  _aa3_), A-not-A question format (`係唔係`).
- **Situational Context**: Natural greetings, introducing yourself, and basic
  identity questions.
- **Vocabulary Target**: 15–20 words. Basic nouns (`人` _jan4_, `朋友`
  _pang4jau5_, `學生` _hok6saang1_), key family terms (`屋企人` _uk1kei2jan4_,
  `細佬` _sai3lou2_), and reflexive `自己` (_zi6gei2_).
- **Rationale**: Restricts vocabulary to fundamental identity terms so students
  can focus on basic subject-verb-object and negation patterns without cognitive
  overload.

#### Chapter 02: Desires, Possessions & Daily Belongings (`02-shopping-slang.md`)

- **Syntactic Goal**: Auxiliary verbs (`想/要`), possessive particle (`嘅`
  _ge3_), existentials (`有/冇`), demonstratives (`呢個/嗰個`), basic counts.
- **Situational Context**: Making basic purchases at a convenience store;
  reporting lost/found items.
- **Vocabulary Target**: 15–20 words. Adjectives (`新` _san1_ | new, `舊` _gau6_
  | old), items (`銀包` _ngan4baau1_ | wallet, `鎖匙` _so2si4_ | keys), and
  transaction slang (`搞掂` _gaau2dim6_).
- **Rationale**: Focuses on simple possessive structures ("my keys", "that
  wallet") and basic desires ("I want this one").

#### Chapter 03: Cafe Ordering & Food Basics (`03-dining-out.md`)

- **Syntactic Goal**: General classifiers (`個/杯/件/隻`), alternative questions
  (`定` _ding6_), coordinating conjunction (`同埋` _tung4maai4_), aspect marker
  (`咗` _zo2_), softener particle (`啦` _laa1_).
- **Situational Context**: Basic Cafe ordering (`茶餐廳`), requesting
  adjustments, and calling for the bill (`埋單`).
- **Vocabulary Target**: 15–20 words. Tableware (`筷子` _faai3zi2_, `匙羹`
  _ci4gang1_), core tastes (`甜` _tim4_, `酸` _syun1_), and basic dining verbs
  (`食` _sik6_, `飲` _jam2_).
- **Rationale**: Simplifies cafe Ordering into a bite-sized first contact.
  Classifiers are restricted to the most generic ones needed to count drinks and
  simple pastries.

#### Chapter 04: Spatial Presence & Basic Travel (`04-existentials-places.md`)

- **Syntactic Goal**: Locative preposition (`喺` _hai2_), directional suffixes
  (`上面/入面/前面/後面`), asking "where" (`邊度` _bin1dou6_), obviousness
  particle (`囉` _lo1_).
- **Situational Context**: Navigating a building lobby, asking security guards
  for directions.
- **Vocabulary Target**: 15–20 words. Directions (`左` _zo2_, `右` _jau6_,
  `直行` _zik6haang4_), structural nouns (`地下` _dei6haa2_ | ground floor,
  `升降機`/`搭Lift` _sing1gong3gei1_/_daap3 lip1_ | elevator).
- **Rationale**: Restricts location descriptors to navigation nouns so learners
  can easily construct and answer simple directional questions.

#### Chapter 05: Travel, Directions & Transport Slang (`05-travel-transport.md`)

- **Syntactic Goal**: Commuting verbs, boarding/riding transport (`搭` _daap3_),
  resultative complements (`到` _dou2_).
- **Situational Context**: Commuting via MTR, red minibuses, and calling out
  stops.
- **Vocabulary Target**: 15–20 words. Transit (`的士`, `巴士`, `地鐵`), actions
  (`落車` _lok6ce1_, `嘟卡` _dut1 ka1_), and key commands (`有落` _jau5lok6_).
- **Rationale**: Keeps transit phrases focused on transport nouns and
  passenger-driver imperatives rather than complex route discussions.

#### Chapter 06: Time-Telling, Frequency & Daily Routines (`06-time-continuous.md`)

- **Syntactic Goal**: Telling time (hours, minutes), continuous aspect (`緊`
  _gan2_), frequency adverbs (`通常` _tung1soeng4_, `有時` _jau5si4_, `從來`
  _cung4loi4_).
- **Situational Context**: Discussing daily schedules, habits, and actions
  currently in progress.
- **Vocabulary Target**: 15–20 words. Daily actions (`瞓覺` _fan3gaau3_ | to
  sleep, `起身` _hei2san1_ | to get up, `沖涼` _cung1loeng4_ | to shower,
  `返屋企` _faan1uk1kei2_ | to go home).
- **Rationale**: Limits routine verbs to the top 5 daily actions to ensure the
  focus remains on aspect markers and scheduling grammar.

---

### Phase 2: Structural Complexity & Domestic Life (Chapters 07–12)

_Phase Goal: Master modal verbs, potential complements, comparatives,
conditionals, split-verbs, connectives, and passives._

#### Chapter 07: Abilities, Skills & Learning (`07-ability-experience.md`)

- **Syntactic Goal**: Modals (`可以/識/會`), potential suffixes (`得` vs
  `唔到`), experiential aspect (`過` _gwo3_).
- **Situational Context**: Describing languages spoken, skills, and past
  learning.
- **Vocabulary Target**: 15–20 words. Instruction verbs (`學` _hok6_ | to learn,
  `教` _gaau1_ | to teach) and basic communication verbs (`講` _gong2_, `聽`
  _teng1_).
- **Rationale**: Restricts context to basic language learning and competence
  claims to reduce vocabulary load.

#### Chapter 08: Wet Markets, Home Cooking & Tastes (`08-wet-market-cooking.md`)

- **Syntactic Goal**: Comparatives using `過` (_gwo3_) (A 過 B), descriptors.
- **Situational Context**: Shopping at local wet markets; discussing home
  cooking and division of chores.
- **Vocabulary Target**: 15–20 words. Grocery actions (`買餸` _maai5sung3_,
  `煮嘢食` _zyu2je5sik6_), ingredients (`菜` _coi3_, `魚` _jyu2_, `牛肉`
  _ngau4juk6_), and basic chores (`洗衫` _sai2saam1_, `洗碗` _sai2wun2_).
- **Rationale**: Limits the market nouns to the absolute most common spoken
  foods so the comparative structure can be practiced clearly.

#### Chapter 09: Hypotheticals, Conditionals & Planning (`09-hypotheticals-conditionals.md`)

- **Syntactic Goal**: Conditionals (`如果` ... `就`), planning.
- **Situational Context**: Discussing future plans, weather forecasts, and
  schedules.
- **Vocabulary Target**: 15–20 words. Planning (`打算` _daa2syun3_), year terms
  (`今年` _gam1nin4_, `出年` _ceot1nin4_, `舊年` _gau6nin4_), and conditional
  markers.
- **Rationale**: Simplifies hypothetical planning to basic if-then constraints
  without adding heavy vocabulary.

#### Chapter 10: Split-Verbs, Hobbies & Emotions (`10-split-verbs-hobbies.md`)

- **Syntactic Goal**: Split-verb syntax, adverbs `又` (_jau6_) and `先`
  (_sin1_).
- **Situational Context**: Weekend hobbies, exercise, and emotional reactions.
- **Vocabulary Target**: 15–20 words. Hobbies (`游水` _jau4seoi2_, `跑步`
  _paau2bou6_), emotions (`嬲` _nau1_ | angry, `驚` _geng1_ | scared).
- **Rationale**: Splitting verbs requires cognitive attention. By using only 2
  or 3 common split-verbs (like `游水`), we keep the lexical focus minimal.

#### Chapter 11: Connectives & Narrative Flow (`11-narrative-cohesion.md`)

- **Syntactic Goal**: Conjunctions (`甚至` _sam6zi3_, `既然` _gei3jin4_, `反而`
  _faan2ji4_).
- **Situational Context**: Simple monologues describing personal history or
  complaints.
- **Vocabulary Target**: 15–20 words. Connectives, pronouns (`其他` _kei4taa1_),
  and states (`無聊` _mou4liu4_).
- **Rationale**: Focuses on sentence transition logic. The vocabulary is kept
  simple to allow the student to build longer multi-clause sentences.

#### Chapter 12: Passives, Focus & Reported Speech (`12-passives-focus-reported.md`)

- **Syntactic Goal**: Passive voice (`俾` _bei2_), focus marker (`即係`
  _zik1hai6_), reported speech (`話` _waa6_).
- **Situational Context**: Workplace updates, explaining misunderstandings.
- **Vocabulary Target**: 15–20 words. Office terms (`老細` _lou5sai3_, `同事`
  _tung4si6_), and events (`發生咩事`).
- **Rationale**: The final structural grammar lesson. Vocabulary is limited to a
  simple office context to practice reported speech and focus highlighting.

---

### Phase 3: Situational Immersion & Lexical Expansion (Chapters 13–29)

_Phase Goal: Rapidly expand vocabulary across specific daily domains, spiraling
the grammatical structures of Phases 1 & 2._

- **Chapter 13: Regrets, Sickness & Health**
  - _Grammar_: Counterfactual regrets (`早知` _zou2zi1_ ... `就` _zau6_), hopes
    (`希望` _hei1mong6_).
  - _Context_: Talking about illness, body parts (`手/腳/眼`), and requesting
    sick leave.
- **Chapter 14: Spoken Intensifiers & Descriptors**
  - _Grammar_: Pre-adjective (`鬼死咁` _gwai2sei2gam3_) and post-adjective (`極`
    _gik6_, `爆` _baau3_, `死` _sei2_) intensifier syntax.
  - _Context_: Exaggerating traits, describing objects/people
    (`重/輕/新/舊/後生/老`).
- **Chapter 15: Rhetorical Questions & Doubts**
  - _Grammar_: Rhetorical question frames (`唔通` ... `咩` _m4tung1 ... me1_,
    `乜` ... `咩` _mat1 ... me1_).
  - _Context_: Disbelieving rumors, expressing sarcasm.
- **Chapter 16: Spoken Particles & Emotive Nuance**
  - _Grammar_: Pragmatic particle combinations (`啫` _ze1_, `嘛` _maa3_, `喇喎`
    _laa3wo3_, `㗎啦` _gaa3laa1_).
  - _Context_: Adding attitude, warning, or resignation to statements.
- **Chapter 17: Workplace Slang & Office Dynamics**
  - _Vocabulary_: Overtime (`OT`), slacking (`摸魚/蛇王`), pay raises
    (`加人工`), office jargon.
- **Chapter 18: Foodie Culture & Tea Restaurant Customizations**
  - _Vocabulary_: Dim sum names, drink customizations (less sweet, less ice),
    and diner shorthand.
- **Chapter 19: Shopping, Bargaining & Spoken Quantifiers**
  - _Vocabulary_: Bargaining phrases (`平啲啦`), payment (`碌卡/現金`),
    classifiers used as quantifiers (`條/頂/對`).
- **Chapter 20: Dating, Relationships & Social Media Slang**
  - _Vocabulary_: Romance (`拍拖/出Pool`), social media (`放閃/呃like`), texting
    habits (`已讀不回`).
- **Chapter 21: Housing, Flat-Hunting & Renting**
  - _Vocabulary_: Rental deposits (`兩按一上`), flat layouts, neighborhood
    descriptions.
- **Chapter 22: Hobbies, Nightlife & Social Gatherings**
  - _Vocabulary_: Clubbing (`夜蒲`), going Dutch (`AA制`), flakes (`飛機王`),
    gatherings (`局`).
- **Chapter 23: Emergencies, Public Services & Logistics**
  - _Vocabulary_: Calling police (`警察`), help (`救命`), lost items (`唔見咗`),
    SF Express (`順豐/速遞`).
- **Chapter 24: Modern Tech, Smart Living & App Slang**
  - _Vocabulary_: App verbs (`whatsapp我`), mobile limits (`爆數據`), charging
    accessories (`火牛/插頭/充電`).
- **Chapter 25: Finance, Investing & Money Slang**
  - _Vocabulary_: Speculating in stocks (`炒股`), bear market (`熊市`), big
    players (`大鱷`), trapped capital (`蟹`).
- **Chapter 26: Traditional Festivals, Superstitions & Cultural Slang**
  - _Vocabulary_: Holiday greetings, ghost festival slang, superstition
    terminology, and cultural taboos.
- **Chapter 27: Remote Work, Productivity & Nomad Slang**
  - _Vocabulary_: Remote work terms, video calls (`開Zoom`), offline disconnects
    (`斷線`), nomad life.
- **Chapter 28: Pets, Animal Care & Vet Slang**
  - _Vocabulary_: Pet ownership, veterinary visits (`睇獸醫`), animal-related
    idioms.

---

## 3. Deep Dive: Phase 3 Deferred Grammar Mechanics

Because Cantonese is an isolating language that relies heavily on particle
morphosyntax, the following 5 topics are treated with separate grammar sections
in Phase 3:

### 1. Counterfactual Regrets (`早知` ... `就`)

Cantonese has no verb conjugations for conditional or subjunctive moods.
Counterfactual regrets are signaled strictly through lexical frames:
$$\text{早知} + [\text{Past Counterfactual Condition}] + \text{就} + [\text{Desired Outcome}]$$

- _Example_:
  `早知[jau2zi1|had I known]昨日[zok6jat6|yesterday]落雨[lok6jyu5|rained]，我[ngo5|I]就[zau6|then]唔[m4|not]出街[ceot1gaai1|go out]啦[laa1|particle]。`
- _Meaning_: Had I known it was going to rain yesterday, I wouldn't have gone
  out.

### 2. Spoken Intensifiers (Morphological Clitics)

Adjectives in Cantonese can be intensified using prefixing adverbials or
suffixing clitics:

- **Pre-Adjective clitic `鬼死咁`**: $$\text{鬼死咁} + \text{Adjective}$$
  _Example_: `佢[keoi5|he]鬼死咁[gwai2sei2gam3|awfully]攰[gui6|tired]。` (He is
  awfully tired.)
- **Post-Adjective clitics (`極`, `爆`, `死`)**:
  $$\text{Adjective} + \text{Clitic}$$ _Example_:
  `開心[hoi1sam1|happy]爆[baau3|explosively]!` (Explosively happy!) _Example_:
  `平[peng4|cheap]到極[dou3gik6|to the limit]!` (Cheapest to the limit!)

### 3. Rhetorical Sentence Frames

Spoken Cantonese utilizes specific opening adverbs combined with final question
particles to assert a statement rhetorically:

- **`唔通` ... `咩` frame** (asserts that a condition is highly unlikely):
  $$\text{唔通} + [\text{Condition}] + \text{咩}?$$ _Example_:
  `唔通[m4tung1|could it be]佢[keoi5|he]會[wui5|will]騙[pin3|cheat]你[nei5|you]咩[me1|rhetorical]?`
  (Could it be that he would cheat you? / Surely he wouldn't cheat you!)
- **`乜` ... `咩` frame** (expresses surprise or incredulity at a reported
  fact): $$\text{乜} + [\text{Reported Fact}] + \text{咩}?$$ _Example_:
  `乜[mat1|how come]你[nei5|you]唔[m4|not]知[zi1|know]咩[me1|rhetorical]?` (How
  come you didn't know? / You didn't know?!)

### 4. Pragmatic Particle Layering

Sentence-final particles are often layered at the end of an utterance. The
sequence must follow strict phonetic and semantic constraints:

- **`啦` (_laa1_ | suggestion) + `喎` (_wo3_ | reported/surprise)** layers into
  `啦喎` (_laa3wo3_ | warning / change of state surprise): _Example_:
  `夠鐘[gau3zung1|time is up]啦喎[laa3wo3|warning]!` (Hey, time is up!)
- **`嘅` (_ge3_ | assertion) + `呀` (_aa3_ | softening)** layers into `㗎`
  (_gaa3_ | assertive statement): _Example_:
  `我[ngo5|I]真係[zan1hai6|really]唔[m4|not]識[sik1|know]㗎[gaa3|assertion].` (I
  really don't know.)

### 5. Advanced Classifiers as Quantifiers

In colloquial speech, dropping numbers and using a classifier directly before a
noun indicates either "a single unit" or functions as a general quantifier:

- _Standard_: `一[jat1|one]條[tiu4|classifier]魚[jyu2|fish]` (one fish)
- _Colloquial_: `買[maai5|buy]條[tiu4|classifier]魚[jyu2|fish]` (buy a fish /
  buy some fish)
- _Bargaining_: `平[peng4|cheap]個[go3|classifier]二[ji6|two]` (make it cheaper
  by $1.20)
