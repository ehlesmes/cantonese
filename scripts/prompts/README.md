# Prompt Engineering & Sub-Agent Orchestration

This directory contains version-controlled system prompt templates used by
agentic coding assistants (like Antigravity) to maintain, expand, and audit the
Cantonese curriculum.

---

## 1. Rationale: Version-Controlled Prompts

Hardcoding massive, complex system prompts directly inside chat interfaces or
custom agent registries introduces significant engineering friction:

- **No History tracking**: Prompt updates are not versioned, leading to silent
  behavioral shifts that are hard to audit.
- **Synchronization Latency**: Switching Git branches or environment instances
  does not automatically update active agents.
- **Coupling**: The prompt remains locked inside a specific workspace context or
  vendor-specific agent configuration.

By capturing prompt specifications in standard markdown files under
`scripts/prompts/`, we ensure that our prompt architecture is **auditable via
Git diffs**, branch-specific, and fully portable.

---

## 2. The Bootloader Pattern

To keep active sub-agents and version-controlled files in perfect
synchronization, we employ the **Bootloader System Prompt** design pattern.

Instead of registering an agent with the full system instructions, we register
the agent with a tiny "bootloader" prompt:

```markdown
You are a Cantonese curriculum author sub-agent.

Before executing any task:

1. You MUST read the live instructions in the project file:
   `scripts/prompts/implement-chapter.md` (relative to the repository root
   directory).
2. Adopt the role, apply the syntax guardrails, and execute the phased workflow
   exactly as specified in that file.
```

### Why This Works:

- **Zero-overhead Synchronization**: The sub-agent reads the live markdown file
  directly from the local workspace at the very beginning of its execution run.
- **Instant Activation**: Any changes you save to `implement-chapter.md` are
  instantly adopted by the sub-agent on its next run—no manual agent
  redefinition or CLI registration required.

---

## 3. Directory Structure & Available Prompts

```
scripts/prompts/
├── README.md               # This documentation
└── implement-chapter.md    # Instruction set for reflective curriculum authoring
```

### 1. [implement-chapter.md](./implement-chapter.md)

Guards the core phased curriculum generation loop:

- **Phase A**: Pedagogical audit and sequential renumbering (no fractional
  chapters allowed).
- **Phase B**: Batch vocabulary database registration using the `--json` option.
- **Phase C**: Collaborative chapter drafting focusing on colloquial spoken
  Cantonese and inline semantic annotations.
- **Phase D**: E2E test verification, formatting compliance, and vocabulary
  database compilation.
- **Phase E**: Staging and lint-clean Git commits.

---

## 4. How to Execute

To implement the next chapter in our curriculum roadmap, you can use either of
the following execution methods:

### Method A: The `/next` Slash Command (Recommended)

Simply type the `/next` command or say "go ahead" in the Antigravity chat
window:

- **How it works**: The main agent dynamically reads `content/curriculum.md` to
  identify the first uncompleted chapter, automatically invokes the
  `curriculum_author` sub-agent with the correct double-digit prefix and spatial
  parameters, and handles all background executions, testing suites, and git
  staging checks programmatically.

### Method B: Manual Sub-Agent Reference

Issue the following manual reference command to the main agent:

> _"Read `scripts/prompts/implement-chapter.md` relative to the repository root
> and execute its phased workflow to evaluate the curriculum map in
> `content/curriculum.md` and implement the next chapter."_
