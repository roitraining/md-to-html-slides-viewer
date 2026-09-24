<!-- course-title: 123: Sample Course -->

<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

# Course 123:
# Sample Course Layout Demonstration

---

<!-- layout: panel-right -->
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

- **Choose the right HTML Slides Viewer layout** for each teaching moment in an ROI course
- Build the standard introduction and the core layouts: default content, auto-split, and columns
- Use cards, panels, and large-media layouts, then close a chapter the standard way

---

<!-- layout: panel-left -->
# Agenda

- Chapter 1: Standard and Split Layouts
- Chapter 2: Cards, Panels, and Large Media
- Questions and Answers

![Agenda](images/agenda.png)

---

<!-- layout: panel-right -->
# Who Should Attend

- Instructors authoring ROI Markdown slide decks
- Course designers learning layout directives
- Anyone evaluating the HTML Slides Viewer

![Who Should Attend](images/who-should-attend.png)

---

<!-- layout: panel-left -->
# Prerequisites

- Comfortable editing Markdown files
- Basic familiarity with HTML comments
- No prior slide-tool experience required

![Prerequisites](images/prerequisites.png)

---

<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

123: Sample Course

# Chapter 1: Standard and Split Layouts

---

# Chapter 1: Objectives

- Explain when to use default content, navigation, and auto-split
- Compare two-column and three-column slides
- Place notes and warnings inside columns or full width under them

---

<!-- layout: navigation -->
# Agenda: Chapter 1

- **Default Content**
- Auto-Split
- Columns and Callouts

---

# Default Slide Layout

This slide demonstrates the default **content** layout. When no layout directive is specified, content flows vertically from top to bottom.

### Markdown features supported
- **Bold text** and *italic text*
- Bullet points (like this list)
- Subheaders (`###` or `##`)
- Callouts and alerts (see below)

> [!NOTE]
> Use a NOTE alert for background context or helpful facts that support the main point.

---

<!-- layout: navigation -->
# Agenda: Chapter 1

- Default Content
- **Auto-Split**
- Columns and Callouts

---

# Auto-Split Layout

- **No directive needed**: a bullet list plus an image triggers this layout automatically
- **Left column**: the first list on the slide
- **Right column**: the first image on the slide
- **Best for**: short points beside a diagram or screenshot

![Sample Diagram](images/sample-diagram.png)

---

<!-- layout: navigation -->
# Agenda: Chapter 1

- Default Content
- Auto-Split
- **Columns and Callouts**

---

<!-- layout: 2-column -->
# Side-by-Side Topics (2 Columns)

### Left Column
- **Independent**: standard text and lists only
- **No image required**: useful for parallel concepts
- **Clean structure**: columns start at each `###` header

### Right Column
- **Symmetric**: equal width beside the left column
- **Easy comparison**: place two alternatives side by side
- **Teaching use**: pros and cons, before and after, local vs remote

---

<!-- layout: 2-column -->
# Two Columns with Notes and Warnings

### Recommended Pattern
- Put callouts under the matching column header
- Keep alert text short so columns stay balanced
- Use NOTE for context the learner should remember

> [!NOTE]
> Alerts belong to the column that contains them. Place the blockquote after that column’s bullets.

### Watch Outs
- Long warnings can push column height unevenly
- Prefer one alert per column on dense slides
- WARNING works well for common authoring mistakes

> [!WARNING]
> Do not put an image on a `2-column` text slide if you only wanted side-by-side lists. Use auto-split (list plus image) or `stacked` instead.

---

<!-- layout: 2-column -->
# Full-Width Callout Below Two Columns

### Pros
- Fast to author in Markdown
- Easy side-by-side comparison
- Works without images

### Cons
- Dense columns can overflow
- Alerts inside columns compete for height
- Longer warnings need full width

<!-- below-columns -->

> [!WARNING]
> To place a callout under both columns, finish the column content, then put `<!-- below-columns -->` on its own line, then add your alert. Everything after that marker spans the full slide width.

---

<!-- layout: three-column -->
# Comparing Features (3 Columns)

### Column A
- **Flexibility**: define layout columns cleanly
- **Alignment**: columns align horizontally
- **Styling**: accent borders match the theme

### Column B
- **Spacing**: generous gap between columns
- **Readability**: strong for side-by-side comparisons
- **Teaching use**: three options or three steps

### Column C
- **Auto-grouping**: built by the viewer from headers
- **Clean Markdown**: simple headers and lists
- **Keep it short**: three short columns beat one crowded slide

---

<!-- layout: three-column -->
# Three Columns with Callouts

### Note
- Background context
- Non-blocking guidance
- Safe defaults

> [!NOTE]
> Use NOTE when the point is helpful context, not a hard requirement.

### Tip
- Faster authoring shortcuts
- Viewer-friendly patterns
- Reusable slide shapes

> [!TIP]
> Draft column headers first, then fill bullets, then add one alert if needed.

### Warning
- Easy-to-miss pitfalls
- Layout conflicts
- Overflow risk

> [!WARNING]
> Keep each column short. Three tall alerts will crowd the 1280 by 720 canvas.

---

<!-- layout: three-column -->
# Full-Width Callout Below Three Columns

### Design
- Pick the layout first
- Keep headers parallel
- Limit to three bullets

### Author
- Write columns next
- Prefer short phrases
- Save callouts for last

### Review
- Check overflow on the design canvas
- Confirm alert placement
- Preview in the viewer

<!-- below-columns -->

> [!NOTE]
> Same pattern for three columns: after the last column, add `<!-- below-columns -->` on its own line, then the alert.

---

<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

123: Sample Course

# Chapter 2: Cards, Panels, and Large Media

---

# Chapter 2: Objectives

- Turn simple headings and lists into cards
- Place an image in a colored side panel or in a large-media layout
- Recognize the standard chapter close: lab, review, quiz, and questions

---

<!-- layout: navigation -->
# Agenda: Chapter 2

- **Cards**
- Panels and Large Media
- Code and Reference

---

<!-- layout: card-layout -->
# Idea Cards from Simple Markdown

### When to use cards
- Use cards when each idea needs a title and a short explanation.
- Keep three or four cards so they stay readable on the 16:9 canvas.
- Write each list item as a complete sentence, not a fragment.

### How the Markdown maps
- Each `###` heading becomes the card title.
- Each dash list item under that heading becomes a sentence in the card body.
- The viewer removes the bullets so the body reads as ordinary prose.

### What to avoid
- Do not pack a full paragraph of teaching into a single card.
- Do not mix images into this layout. Use auto-split or stacked instead.
- If you need a comparison table, use columns or a table, not cards.

---

<!-- layout: card-layout -->
# Four Cards on One Slide

### Name the idea
- Give every card a short title that an instructor can point to.
- The title should be the claim, not a category label.

### Write sentences
- Body text is sentences, even though you author them as a dash list.
- One thought per line keeps the card scannable from the back of the room.

### Limit the set
- Four cards fill a 2 by 2 grid on the design canvas.
- If a fifth idea appears, start a new slide rather than shrinking the type.

### Stay on theme
- Card color, type, and the accent bar come from the active slide theme.
- Switching ROI Theme, Demo Theme, and Holcim Theme restyles the cards without new Markdown.

---

<!-- layout: navigation -->
# Agenda: Chapter 2

- Cards
- **Panels and Large Media**
- Code and Reference

---

<!-- layout: panel-left -->
# Panel on the Left

The colored third comes from the active theme. Title and text stay in the light area. The image is centered in the panel.

![Agenda graphic](images/agenda.png)

---

<!-- layout: panel-right -->
# Panel on the Right

Use this for section openers such as Welcome and Who Should Attend. Agenda and Prerequisites use the left panel.

![Prerequisites graphic](images/prerequisites.png)

---

<!-- layout: title-image -->
# High-Resolution Immersive Image

![Immersive Slide Diagram](images/sample-diagram.png)

---

<!-- layout: image-only -->
# Architecture Diagram

![Architecture Diagram](images/sample-diagram.png)

---

<!-- layout: full-bleed -->
# Full-Bleed Photo

![Full-bleed architecture diagram](images/sample-diagram.png)

---

<!-- layout: stacked -->
# Stacked Content and Image

- Use when the diagram is wider than tall and needs full slide width
- Bullets stay readable above the visual
- Auto-split is intentionally disabled for this layout

![Stacked Diagram](images/sample-diagram.png)

---

<!-- layout: navigation -->
# Agenda: Chapter 2

- Cards
- Panels and Large Media
- **Code and Reference**

---

# Code Blocks and Rich Callouts

Here is a block of code with syntax highlighting and a copy button:

```javascript
// A simple JavaScript function
function showStatus(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Status: ${message}`);
}
```

> [!TIP]
> Use TIP alerts for helpful suggestions or productivity shortcuts.

> [!WARNING]
> Use WARNING alerts for mistakes, gotchas, or security considerations.

---

# Layout Reference Cheat Sheet

| Layout | Directive | Behavior |
| :--- | :--- | :--- |
| **Title** | `layout: title` | Centered cover or chapter divider |
| **Content** | *(none)* | Default top-to-bottom flow |
| **Navigation** | `layout: navigation` | Agenda list; bold exactly one active topic |
| **Auto-Split** | *(automatic)* | List left, image right when both are present |
| **Two Column** | `layout: 2-column` | Text columns from `###` headers; optional below-columns marker |
| **Three Column** | `layout: three-column` | Three parallel text columns |
| **Card Layout** | `layout: card-layout` | `###` titles become cards; list items become sentences (no bullets) |
| **Panel Left** | `layout: panel-left` | Theme color fills the left third; image centered there |
| **Panel Right** | `layout: panel-right` | Theme color fills the right third; image centered there |
| **Title Image** | `layout: title-image` | Visible title; image fills remaining height |
| **Image Only** | `layout: image-only` | Image fills the stage; H1 labels the tray only |
| **Full Bleed** | `layout: full-bleed` | Image covers the whole 16:9 slide, including top bar and footer |
| **Stacked** | `layout: stacked` | Content on top; image below full width |

---

# Hands-On Lab Exercise

**Time:** 15 minutes

- [View Lab Guide](https://labv.roitraining.com/)

---

# What You Learned

- Explained when to use default content, navigation, and auto-split
- Compared two-column and three-column slides
- Placed notes and warnings inside columns or full width under them
- Turned simple headings and lists into cards
- Placed an image in a colored side panel or in a large-media layout
- Recognized the standard chapter close: lab, review, quiz, and questions

---

# Quiz 1 of 3

**You need a warning under both columns, not inside one of them. What do you add?**

- A. A second `#` heading
- B. `<!-- below-columns -->` on its own line, then the alert
- C. `<!-- layout: full-bleed -->`
- D. An image so the slide auto-splits

---

# Quiz 1: Answer

**You need a warning under both columns, not inside one of them. What do you add?**

**Correct: B.** `<!-- below-columns -->` on its own line, then the alert

- Content before the marker stays in the columns
- Content after the marker spans the full slide width
- The same marker works for two-column and three-column slides
- An image would auto-split a default slide, which is a different layout

---

# Quiz 2 of 3

**Which layout covers the top bar and the footer?**

- A. `image-only`
- B. `title-image`
- C. `full-bleed`
- D. `panel-right`

---

# Quiz 2: Answer

**Which layout covers the top bar and the footer?**

**Correct: C.** `full-bleed`

- `image-only` fills the content area and keeps the top bar and footer
- `title-image` keeps a visible title and fits the image below it
- `panel-right` colors one third of the slide and leaves the chrome in place
- `full-bleed` covers the entire 16:9 slide

---

<!-- layout: 2-column -->
# Quiz 3 of 3: Discussion

### Prompt
You have four short ideas. Each needs a title and two sentences. No diagram.

### Discuss
- Would you use cards, columns, or a default bullet list?
- What breaks if you add a fifth idea on the same slide?
- When would you switch to auto-split instead?

---

<!-- layout: 2-column -->
# Quiz 3: Discussion Points

**You have four short ideas. Each needs a title and two sentences. No diagram.**

### Strong Answers Mention
- Cards: each `###` is a title and the list items become sentences
- Four cards use a 2 by 2 grid; a fifth idea belongs on the next slide
- Columns fit a comparison, not four separate explanations
- Auto-split needs a list and an image, so it does not apply here

### Watch For
- Packing a paragraph into one card
- Shrinking type to force a fifth card onto the slide
- Choosing full-bleed when there is no image

---

<!-- layout: stacked -->
# Questions and Answers

![Questions and Answers](images/qa.png)
