---
name: course-generator
description: >
  Designs, outlines, and writes ROI Training Markdown slide courses for the HTML
  Slides Viewer—one file per chapter, intermediate professional audience, layouts,
  alerts, and images. Use when creating courses, presentations, chapter outlines,
  converting docs to slides, or choosing layout directives.
---

# Course Generator Skill

Write **intermediate professional training** decks that compile cleanly in the HTML Slides Viewer. Prefer scannable slides for an instructor-led classroom—not beginner textbooks pasted into Markdown.

**Always read** [examples/layout-templates.md](examples/layout-templates.md) and copy those templates rather than inventing syntax.

---

## 1. Audience and product context

- **Default audience**: intermediate professionals (e.g. programmers teaching programmers, managers with experience).
- **Advanced** courses when the topic warrants it; **beginner** only when the user explicitly asks.
- Duration ranges from about **1–2 hours** to **multi-day** (3–4 days). Size the outline to the allotted time.

---

## 2. Design workflow

1. List **tangible teaching objectives** (what students will know or be able to do).
2. Organize into **chapters → sections** that build sequentially for the time budget.
3. Present/confirm the outline with the user when practical.
4. Write **multiple Markdown files** (never one mega-file for a full course)—see §3.
5. Generate or placeholder **images** under `images/`—see §7.
6. Run the **Validation checklist** (§10) before delivering.

---

## 3. Multi-file course output (required)

When asked for a **course**, emit separate files:

| File | Contents |
| :--- | :--- |
| Introduction (Chapter 0) | Intro spine only |
| Chapter 1…N | One file per content chapter |

### Naming convention

```text
00-introduction.md
01-getting-started.md
02-basic-language-syntax.md
…
images/          # shared visuals for all chapters
```

Use zero-padded indexes and short kebab-case slugs.

### Per-file rules

- Put the **same** `<!-- course-title: NNN: Short Name -->` at the top of **every** file (viewer footer).
- Each file is its own slide deck fragment: slides separated by a lone `---` line.
- Do **not** collapse a multi-chapter course into a single Markdown file.

---

## 4. Timing heuristics (guidelines)

- ~**2–3 minutes** of lecture per content slide on average.
- Section: ~**6–10** teaching slides.
- Chapter: ~**3–4** sections → ~**30–40** slides → ~**90–120** minutes lecture (~**1.5–2.5 hours**).
- Activity/lab stub: estimate **20–30 minutes** (link only—do not author lab steps).
- Full training day: aim for **4–5** labs (often 2 chapters morning, 2–3 afternoon). Adjust when lengths differ.

---

## 5. Required course structures

### Introduction chapter (`00-introduction.md`), in order

1. **Title** — `<!-- layout: title -->` (logo + course title/subtitle)
2. **Welcome!** — ROI positioning; Meet your instructor (Name / Background / Contact info placeholders—**do not invent** a fake instructor); Let’s get started!
3. **Course Objectives** — bullets: **1 overall course objective**, then **one objective per content chapter** (5 chapters → 6 bullets)
4. **Agenda** — list of **chapters** (course-level orientation; not section Navigation)
5. **Who Should Attend**
6. **Prerequisites**

### Each content chapter file, in order

1. **Chapter title page** — `<!-- layout: title -->`
2. **Chapter Objectives**
3. **For each section:**
   - **Navigation** — `<!-- layout: navigation -->`: full section list; bold **exactly one** current section (where we’ve been / where we are / where we’re going; ~2 seconds of instructor time)
   - **Section teaching slides** (~6–10 typical)
4. **Activity / Hands-On Lab** — title, time estimate, link to lab instructions **only** (labs are authored by a different process)
5. **What You Learned** — past tense of the Chapter Objectives (same ideas)
6. **Q&A** — title `Q&A`; body `Questions?`

---

## 6. Viewer Markdown correctness

Slides only display correctly if they follow HTML Slides Viewer syntax.

### Structure

- `<!-- course-title: … -->` at the top of **each** chapter file
- Lone `---` between slides
- Clean layout comments on their own line—never nest HTML comments
- Valid directives only: `title` | `navigation` | `2-column` / `two-column` | `3-column` / `three-column` | `title-image`

### Layout selection matrix

| Layout | Directive | Use when |
| :--- | :--- | :--- |
| **Title** | `<!-- layout: title -->` | Course cover and chapter dividers |
| **Navigation** | `<!-- layout: navigation -->` | Section orientation; bold exactly one active item |
| **Content** | *(omit)* | Default vertical bullets, short code, tables, alerts |
| **Auto-split** | *(omit)* | Same slide has **both** a bullet list and an image → list left, image right |
| **Two-column** | `<!-- layout: 2-column -->` | Compare two items; pros/cons; before/after. Columns start at `###` |
| **Three-column** | `<!-- layout: 3-column -->` | Three parallel options. Columns start at `###` |
| **Title-image** | `<!-- layout: title-image -->` | One large diagram/screenshot that should dominate |

**Variety:** do not use default content layout more than **3 times in a row**.

### Callouts / alerts

Use sparingly for teaching emphasis:

| Alert | Use for |
| :--- | :--- |
| `> [!NOTE]` | Context / background |
| `> [!TIP]` | Shortcuts / pro tips |
| `> [!WARNING]` | Pitfalls |
| `> [!IMPORTANT]` | Must-not-miss rules |
| `> [!CAUTION]` | Strong caution (supported by the viewer) |

### Other syntax rules

- Code fences **must** include a language tag (` ```python `, ` ```bash `, ` ```hcl `, etc.)
- Prefer a **table** or **3-column** layout instead of more than **two levels** of nested bullets
- Keep slides scannable: short bullets; avoid walls of text; ~6 bullets / ~8 words per bullet when practical
- Code teaching slides: small focused snippets (about 5–15 lines), not dumps

---

## 7. Images policy (required)

Visuals are part of course quality—not optional decoration.

### When to use images

- Diagrams, analogies, infographics, charts, architecture drawings, AI-generated photos when they improve understanding or appeal
- Screenshots when teaching UI/tooling
- Prefer `title-image` or auto-split when a visual should dominate or sit beside bullets

### Where files live

- Store all course images under a shared **`images/`** folder beside the chapter Markdown files
- Reference with relative paths: `![Architecture overview](images/ch02-remote-state-diagram.png)`
- Use descriptive filenames (chapter/topic); never `image1.png`

### Generate vs placeholder

- **If you can create the image** (diagram/infographic/analogy/photo via available tools): save under `images/` and wire `![alt](images/...)`
- **If you cannot create an accurate asset** (real product screenshots, proprietary UI, exact branded captures): still add the Markdown image reference **and** a human TODO, e.g.

```markdown
<!-- TODO IMAGE: Screenshot of AWS S3 console showing bucket versioning enabled -->
![S3 versioning console](images/ch03-s3-versioning-screenshot.png)
```

- Never silently omit a needed visual; prefer a placeholder over a weak text-only slide
- Do **not** invent fake product screenshots when accuracy matters—use a placeholder

---

## 8. Visual and layout quality bar

- Mix layouts; bullets are the default, not the only tool
- Use **2-column / 3-column** for comparisons and options
- Include code samples in programming courses
- Professional training tone: direct, concrete, minimal hype

---

## 9. Explicit non-goals

- **Do not write lab exercise bodies**—only the lab stub slide (title, time, link)
- **Do not invent instructor bio**—use Welcome placeholders
- **Do not** put an entire multi-chapter course in one Markdown file
- **Do not** leave a broken image link without a TODO when the file was not generated

---

## 10. Validation checklist

Before delivering:

- [ ] One file for intro + one file per content chapter; naming follows `00-…`, `01-…`
- [ ] Same `<!-- course-title: … -->` in every file
- [ ] Intro slide order: Title → Welcome → Course Objectives → Agenda → Who Should Attend → Prerequisites
- [ ] Course Objectives = 1 overall + 1 per content chapter
- [ ] Each chapter: Title → Objectives → (Nav → section slides)… → Lab stub → What You Learned → Q&A
- [ ] Every section Navigation lists **all** sections with **exactly one** `**bold**` item
- [ ] Lab stub has title, time estimate, and link only (no lab steps authored here)
- [ ] What You Learned is past tense of Chapter Objectives; Q&A is minimal
- [ ] Layout directives are valid; comments are clean (not nested)
- [ ] Alerts use correct `[!NOTE]|[!TIP]|[!WARNING]|[!IMPORTANT]|[!CAUTION]` syntax
- [ ] Code fences have language tags
- [ ] Images live under `images/` with relative links; TODOs present where assets were not generated
- [ ] No more than 3 consecutive default content slides; tables/columns used instead of deep nesting
- [ ] Timing/size roughly matches requested duration

---

## 11. Templates

Copy-paste patterns: [examples/layout-templates.md](examples/layout-templates.md).
