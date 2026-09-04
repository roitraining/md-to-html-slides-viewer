<!-- course-title: HCA: Tokenomics & Token Optimization -->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

# Introduction to Tokenomics
# and Token Optimization

## Estimate, reduce, and architect LLM usage for cost and latency at scale

---

# Welcome!

- ROI leads the industry in designing and delivering customized technology and management training solutions
- Meet your instructor
  - Name
  - Background
  - Contact info
- Let’s get started!

![Welcome](images/welcome.png)
---

# Course Objectives

- **Run LLM workloads efficiently** by understanding tokens, estimating usage, and designing for cost control
- Explain what tokens are and how models are priced by them
- Estimate token consumption for prompts, context, and outputs
- Apply techniques to reduce token usage without losing quality
- Recognize architectural choices (caching, retrieval, model selection) that control cost

---

# Agenda

- Segment 1: Token Fundamentals (~20 min)
- Segment 2: Optimizing Usage (~25 min)
- Segment 3: Cost-Aware Architecture (~15 min)
- Q&A (~15 min)

![Agenda](images/agenda.png)
---

# Who Should Attend

- Developers building LLM-powered features
- Solution architects designing GenAI systems
- Technical product owners accountable for AI spend
- Platform engineers operating shared model gateways

![Who Should Attend](images/who-should-attend.png)
---

# Prerequisites

- Familiarity with generative AI / LLM basics
- Comfort reading simple API request/response shapes
- Helpful: exposure to prompt design or RAG concepts
- Helpful: access to a tokenizer or provider usage dashboard for the demo

![Prerequisites](images/prerequisites.png)
---
<!-- layout: navigation -->
# Course Roadmap

- **Token Fundamentals**
- Optimizing Usage
- Cost-Aware Architecture

---

# Why Tokenomics Matters

- Tokens drive **cost**, **latency**, and **context limits**
- Unbounded prompts and histories create surprise bills
- Quality does not require maximum context every time
- Efficient design is a product capability—not only a FinOps afterthought

> [!NOTE]
> “Tokenomics” here means the economics and mechanics of token consumption—not crypto tokens.

---
<!-- layout: title-image -->
# What Is a Token?

![What is a token](images/what-is-a-token.png)

---

# Tokenization Basics

- Models don’t read raw characters; a **tokenizer** splits text into tokens
- Common English heuristic: **~4 characters ≈ 1 token** (rough; varies by language/code)
- Code, URLs, and rare words often use **more** tokens than you expect
- Always measure with the **same tokenizer family** as your target model when precision matters

```text
"tokenization"  →  may be 1–3 tokens depending on the tokenizer
"SELECT * FROM patients;"  →  often token-heavier than plain prose
```

---
<!-- layout: title-image -->
<!-- # Input vs. Output Tokens -->

![Input vs output tokens](images/input-vs-output-tokens.png)

---
<!-- layout: 2-column -->
# How Pricing Usually Works

### Billable Units
- Price per **1K / 1M input tokens**
- Price per **1K / 1M output tokens**
- Output often costs more than input

### Other Cost Drivers
- Model tier (flash vs pro)
- Cached / batch discounts*
- Tool/agent multi-call amplification

---
<!-- layout: title-image -->
# Context Windows

![Context window budget](images/context-window-budget.png)

---

# Estimating Consumption

| Piece | What to count |
| :--- | :--- |
| System prompt | Static instructions every call |
| User turn | Current question / task |
| History | Prior turns you resend |
| Retrieved docs | RAG chunks injected |
| Tools / schemas | Specs sent to the model |
| Output | `max_tokens` ceiling × expected length |

> [!TIP]
> Rough monthly cost ≈ calls × (avg input + avg output tokens) × price per token—then add retries and tool loops.

---
<!-- layout: 3-column -->
# Quick Estimation Example

### Prompt
- 800 input tokens
- Includes short history

### Completion
- ~300 output tokens
- Cap at 512

### At scale
- 100k calls/mo
- Watch history growth

---
<!-- layout: navigation -->
# Course Roadmap

- Token Fundamentals
- **Optimizing Usage**
- Cost-Aware Architecture

---
<!-- layout: title-image -->
# Levers to Reduce Spend

![Token optimization levers](images/token-optimization-levers.png)

---
<!-- layout: 2-column -->
# Prompt Compression

### Do
- Short system prompts
- Bullet constraints
- Reuse shared templates
- Remove repeated boilerplate

### Avoid
- Novel-length instructions
- Pasting entire style guides
- Duplicating rules every turn
- “Explain everything” defaults

---

# Context Trimming

- Keep only the **last N turns** or summarize older history
- Drop irrelevant tool traces from the next prompt
- Prefer structured state over raw transcript dumps
- Enforce a hard input budget per request type

> [!IMPORTANT]
> Long chat history is a silent cost multiplier—trim by design, not by accident.

---
<!-- layout: 2-column -->
# Caching and Retrieval (RAG)

### Caching
- Cache stable system prompts
- Cache repeated tool schemas
- Reuse embeddings / results
- Provider prompt caching where available

### RAG
- Retrieve top-k chunks—not whole corpora
- Chunk & rank for relevance
- Cite sources; skip filler
- Fail closed when nothing relevant

---

# Truncation Strategies

- Set **`max_output_tokens`** appropriate to the task (titles ≠ reports)
- Ask for concise formats: tables, bullets, JSON schemas
- Stop sequences / structured outputs reduce rambling
- For docs: summarize first, expand on demand (two-step)

| Task | Output posture |
| :--- | :--- |
| Classification | Tiny (labels / JSON) |
| Code fix | Diff-sized |
| Executive summary | Hard word/token cap |
| Deep analysis | Separate “expand” call |

---
<!-- layout: navigation -->
# Course Roadmap

- Token Fundamentals
- Optimizing Usage
- **Cost-Aware Architecture**

---
<!-- layout: title-image -->
<!-- # Design for Efficiency -->

![Cost-aware architecture](images/cost-aware-architecture.png)

---
<!-- layout: 2-column -->
# Model Right-Sizing and Routing

### Right-Size
- Small/fast models for easy tasks
- Larger models for hard reasoning
- Don’t default everything to “pro”

### Route
- Classify intent first
- Escalate only when needed
- A/B quality vs cost
- Cache frequent answers

---

# Monitoring Token Usage and Budgets

- Meter **input, output, cached, and embedding** tokens per feature
- Attribute spend to app, team, and environment
- Alert on spikes (runaway agents, loops, huge RAG)
- Set budgets and rate limits before launch—not after the invoice

> [!WARNING]
> Multi-step agents can multiply token use per user action. Budget at the *workflow* level, not only per single LLM call.

---
<!-- layout: 3-column -->
# Control Plane Checklist

### Product
- Task SLAs
- Quality bar
- Kill switches

### Platform
- Gateway metering
- Model catalog
- Cache & RAG defaults

### FinOps
- Budgets / quotas
- Chargeback
- Monthly reviews

---

# Efficiency Without Losing Quality

- Optimize the **80% routine traffic** first
- Keep an evaluation set so cost cuts don’t silently tank quality
- Prefer architectural fixes (routing, RAG, cache) over endless prompt micro-edits alone
- Document defaults: model, max tokens, history policy, top-k

---

# What You Learned

- Explained what tokens are and how model pricing relates to them
- Estimated token consumption across prompts, context, and outputs
- Applied techniques to reduce usage without blindly sacrificing quality
- Recognized caching, retrieval, and model-selection choices that control cost

---

# Quiz 1 of 3

**How does LLM pricing usually work?**

- **A.** Providers bill only by character count, never by tokens
- **B.** Only embeddings are free; prompts and completions are not metered
- **C.** All models cost a fixed monthly seat with unlimited context
- **D.** Input and output tokens are billable units—and output often costs more than input

---

# Quiz 1 — Answer

**Correct: D**

- Tokenizers split text into billable units (roughly ~4 chars ≈ 1 English token)
- Input and output are priced separately; output is often more expensive
- Model tier, caching, and multi-call agents also drive cost
- Context limits and latency are tied to token volume too

---

# Quiz 2 of 3

**Your chat feature resends the full conversation every turn and bills are climbing. What is the best first fix?**

- **A.** Always paste the entire knowledge corpus into every prompt
- **B.** Keep only the last N turns or summarize older history, and enforce a hard input budget
- **C.** Remove `max_output_tokens` so the model can answer freely
- **D.** Route every request to the largest “pro” model by default

---

# Quiz 2 — Answer

**Correct: B**

- Long history is a silent cost multiplier—trim by design
- Summarize or drop irrelevant tool traces instead of dumping transcripts
- Cap outputs and right-size models; don’t default everything to pro
- Prefer RAG top-k over pasting whole corpora

---
<!-- layout: 2-column -->
# Quiz 3 of 3 — Discussion

### Prompt
You are designing an LLM feature expected to handle 100k calls/month.

### Discuss
- What pieces would you count when estimating tokens (system, history, RAG, output)?
- Which architectural levers (routing, cache, RAG top-k) would you bake in from day one?
- How would you monitor spend so a runaway agent doesn’t surprise Finance?

---
<!-- layout: 2-column -->
# Quiz 3 — Discussion Points

### Strong Answers Mention
- Calls × (avg input + avg output) × price—plus retries/tool loops
- Small models for routine traffic; escalate only when needed
- Metering by feature/team; budgets, alerts, workflow-level limits
- Eval set so cost cuts don’t silently tank quality

### Watch For
- Optimizing only micro-prompt edits while ignoring architecture
- Budgeting per single call but not multi-step agent workflows
- Unlimited history and max tokens “for quality”

---
<!-- layout: title-image -->
# Q&A

![Questions](images/qa.png)
