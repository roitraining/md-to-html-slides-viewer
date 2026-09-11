<!-- course-title: 123: Sample Course -->

<!-- Cover: layout title -->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

# Course 123:
# Sample Course Layout Demonstration

---

<!-- Welcome: auto-split (bullets + image) -->
# Welcome!

- ROI leads the industry in designing and delivering customized technology and management training solutions
- Meet your instructor
  - Name
  - Background
  - Contact info
- Let's get started!

![Welcome](images/welcome.png)

---

<!-- Course Objectives: default content (bullets only) -->
# Course Objectives

- **Author polished ROI slide decks in Markdown** using the HTML Slides Viewer layouts and directives
- Choose the right layout for standard content, auto-split, columns, and large media
- Place notes and warnings inside columns or full-width under them
- Use the layout reference patterns when building your own courses

---

<!-- Agenda: auto-split -->
# Agenda

- Chapter 1: Standard and Split Layouts
- Chapter 2: Columns, Callouts, and Large Media
- Layout reference and hands-on practice
- Questions and Answers

![Agenda](images/agenda.png)

---

<!-- Who Should Attend: auto-split -->
# Who Should Attend

- Instructors authoring ROI Markdown slide decks
- Course designers learning layout directives
- Anyone evaluating the HTML Slides Viewer

![Who Should Attend](images/who-should-attend.png)

---

<!-- Prerequisites: auto-split -->
# Prerequisites

- Comfortable editing Markdown files
- Basic familiarity with HTML comments
- No prior slide-tool experience required

![Prerequisites](images/prerequisites.png)

---

<!-- Default content layout (no layout directive) -->
# Default Slide Layout

This slide demonstrates the default **content** layout. When no layout directive is specified, content flows vertically from top to bottom.

### Markdown Features Supported
- **Bold text** and *italic text*
- Bullet points (like this list)
- Subheaders (`###` or `##`)
- Callouts and alerts (see below)

> [!NOTE]
> Use a NOTE alert for background context or helpful facts that support the main point.

---

<!-- Chapter 1 divider -->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

123: Sample Course

# Chapter 1: Standard and Split Layouts

---

<!-- Navigation: bold exactly one active topic -->
<!-- layout: navigation -->
# Agenda: Chapter 1

- **Introduction to Layouts**
- Default Content Slides
- Auto-Split Layouts

---

<!-- Auto-split: list + image, no layout directive -->
# Auto-Split Layout

- **No directive needed**: A bullet list plus an image triggers this layout automatically
- **Left column**: The first list on the slide
- **Right column**: The first image on the slide
- **Best for**: Short points beside a diagram or screenshot

![Sample Diagram](images/sample-diagram.png)

---

<!-- Navigation: second topic active -->
<!-- layout: navigation -->
# Agenda: Chapter 1

- Introduction to Layouts
- **Default Content Slides**
- Auto-Split Layouts

---

<!-- Chapter 2 divider -->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

123: Sample Course

# Chapter 2: Columns, Callouts, and Large Media

---

<!-- Explicit 2-column text layout -->
<!-- layout: 2-column -->
# Side-by-Side Topics (2 Columns)

### Left Column
- **Independent**: Standard text and lists only
- **No image required**: Great for parallel concepts
- **Clean structure**: Columns start at each `###` header

### Right Column
- **Symmetric**: Equal width beside the left column
- **Easy comparison**: Place two alternatives side by side
- **Teaching use**: Pros and cons, before and after, local vs remote

---

<!-- 2-column with alerts inside each column -->
<!-- layout: 2-column -->
# Two Columns with Notes and Warnings

### Recommended Pattern
- Put callouts under the matching column header
- Keep alert text short so columns stay balanced
- Use NOTE for context the learner should remember

> [!NOTE]
> Alerts belong to the column that contains them. Place the blockquote after that column's bullets.

### Watch Outs
- Long warnings can push column height unevenly
- Prefer one alert per column on dense slides
- WARNING works well for common authoring mistakes

> [!WARNING]
> Do not put an image on a `2-column` text slide if you only wanted side-by-side lists. Use auto-split (list + image) or `stacked` instead.

---

<!-- Explicit 3-column text layout -->
<!-- layout: three-column -->
# Comparing Features (3 Columns)

### Column A
- **Flexibility**: Define layout columns cleanly
- **Alignment**: Columns align horizontally
- **Styling**: Accent borders match the theme

### Column B
- **Spacing**: Generous gap between columns
- **Readability**: Strong for side-by-side comparisons
- **Teaching use**: Three options or three steps

### Column C
- **Auto-grouping**: Built by the viewer from headers
- **Clean Markdown**: Simple headers and lists
- **Keep it short**: Three short columns beat one crowded slide

---

<!-- 3-column with one alert style per column -->
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
> Keep each column short. Three tall alerts will crowd the 1280x720 canvas.

---

<!-- Full-width alert under two columns: standalone below-columns marker -->
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
> To place a callout under both columns, finish the column content, then put `<!-- below-columns -->` on its own line, then add your `> [!NOTE]` or `> [!WARNING]` block.

---

<!-- Full-width alert under three columns -->
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
> Same Markdown pattern for three columns: after the last column, add `<!-- below-columns -->` on its own line, then the alert. Everything after that marker spans the full slide width.

---

<!-- Title + large image filling remaining height -->
<!-- layout: title-image -->
# High-Resolution Immersive Image

![Immersive Slide Diagram](images/sample-diagram.png)

---

<!-- Image fills the stage; H1 is for the slide tray only -->
<!-- layout: image-only -->
# Architecture Diagram

![Architecture Diagram](images/sample-diagram.png)

---

<!-- Stacked: content on top, image below (disables auto-split) -->
<!-- layout: stacked -->
# Stacked Content and Image

- Use when the diagram is wider than tall and needs full slide width
- Bullets stay readable above the visual
- Auto-split is intentionally disabled for this layout

![Stacked Diagram](images/sample-diagram.png)

---

<!-- Code fence + callouts on default content layout -->
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

<!-- Layout reference table -->
# Layout Reference Cheat Sheet

| Layout | Directive | Behavior |
| :--- | :--- | :--- |
| **Title** | `layout: title` | Centered cover or chapter divider |
| **Content** | *(none)* | Default top-to-bottom flow |
| **Navigation** | `layout: navigation` | Agenda list; bold exactly one active topic |
| **Auto-Split** | *(automatic)* | List left, image right when both are present |
| **Two Column** | `layout: 2-column` | Text columns from `###` headers; optional below-columns marker |
| **Three Column** | `layout: three-column` | Three parallel text columns |
| **Title Image** | `layout: title-image` | Visible title; image fills remaining height |
| **Image Only** | `layout: image-only` | Image fills the stage; H1 labels the tray only |
| **Stacked** | `layout: stacked` | Content on top; image below full width |

---

<!-- Short practice prompt -->
# Hands-On Lab Exercise

**Duration**: 15 minutes

### Try this
1. Open this course Markdown file in your editor
2. Add a new slide separated by a triple-dash (`---`)
3. Experiment with different layout directives
4. Refresh the viewer to see your changes

- [View Lab Guide](https://roitraining.github.io/md-to-html-lab-viewer/)

---

# Course Wrap-Up

### Key Concepts Covered
1. Author slides with Markdown and HTML comment directives
2. Choose the layout that matches the teaching shape
3. Use code blocks, tables, and callouts where they help
4. Place notes and warnings inside columns or full-width under them

---

<!-- layout: stacked -->
# Questions and Answers

![Questions and Answers](images/qa.png)
