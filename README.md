# Markdown to HTML Slides Viewer

A lightweight, modern, responsive presentation viewer that renders structured Markdown documents into beautiful slides. Features rich typography, dark mode, interactive drawing canvases, PDF exporting, and diverse slide layout directives.

---

## How to View the Slides

### GitHub Pages (recommended)

The viewer is published at:

**[https://roitraining.github.io/md-to-html-slides-viewer/](https://roitraining.github.io/md-to-html-slides-viewer/)**

Open that link and it will load the built-in sample course (`sample-course.md`) by default.

### Open a course from another GitHub repo

Pass a Markdown file URL with the `course` query parameter. Use the **raw** GitHub URL (not the normal `github.com/.../blob/...` page).

Example — LangChain slide course:

```
https://roitraining.github.io/md-to-html-slides-viewer/?course=https://raw.githubusercontent.com/roitraining/markdown-slide-authoring-course/main/course-langchain.md
```

You can also paste a standard GitHub file URL; the viewer will rewrite it to the raw form when possible.

### Run the Viewer Locally

Because the viewer fetches the course Markdown file over HTTP, run it from a local web server (browsers block `file://` fetches).

From the project directory:
```bash
python3 -m http.server 8000
```
Then open:
```
http://localhost:8000/index.html?course=sample-course.md
```
Or point `course=` at any reachable Markdown URL, same as on GitHub Pages.

### Edit a course on your machine

The editor is a separate app for editing staff. It is not linked from the instructor viewer. Locally, with the same static server:

```
http://localhost:8000/editor.html
```

Choose a course folder in Chrome or Edge. Save writes the Markdown file in that folder. The editor does not open GitHub courses.

Deploy it as its own Cloud Run service:

```bash
docker build -f Dockerfile.editor -t slide-editor .
```

That image uses [nginx.editor.conf](nginx.editor.conf) and serves `editor.html`. The instructor service keeps [Dockerfile](Dockerfile) and [nginx.conf](nginx.conf).

---

## Getting Started

### Structure Your Markdown
Slides are written in Markdown. Use a triple-dash (`---`) on its own line to separate slides. Customize slide properties using HTML comments:
*   Set course footer title (at top of file): `<!-- course-title: My Slide Course -->`
*   Set slide layouts: `<!-- layout: title -->`, `<!-- layout: navigation -->`, `<!-- layout: 2-column -->`, `<!-- layout: 3-column -->`, `<!-- layout: card-layout -->`, `<!-- layout: panel-left -->`, `<!-- layout: panel-right -->`, `<!-- layout: title-image -->`, `<!-- layout: image-only -->`, `<!-- layout: full-bleed -->`, or `<!-- layout: stacked -->`.

---

## Slides & Layout Directives

The presentation engine supports the following layout types:
1.  **Cover Slide (`title`)**: Centers header text, subtitle, and logos.
2.  **Default Content (`content`)**: Flows vertically. Supports markdown tables, list blocks, code formatting, and alert blockquotes (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`).
3.  **Agenda Agenda (`navigation`)**: Splits the slide into active topics highlighted in bold black, with others muted to light grey.
4.  **Auto-Split (2-Column)**: Triggered automatically in standard content layout if both a list and an image are present on a slide (bullets left, image right).
5.  **Custom Columns (`2-column` and `3-column`)**: Separates slide content into equal side-by-side vertical flex columns, starting at each subheader (`h3`, `h2`, or `h4`).
6.  **Card Layout (`card-layout`)**: Turns each `###` heading into a card title. Dash list items under that heading become sentences in the card body (no bullets). Three cards sit in a row; four cards use a 2-by-2 grid.
7.  **Immersive Media (`title-image`)**: Displays a title and scales a single diagram image to fill all remaining vertical viewport space without overflow.
8.  **Image Only (`image-only`)**: Same full-stage image as title-image, but the Markdown `#` heading is used only for the slide tray label (hidden on the stage).
9.  **Full Bleed (`full-bleed`)**: Image covers the entire 16:9 slide, including the top accent bar and footer. The heading is tray-only, same as image-only.
10. **Stacked (`stacked`)**: Keeps title and content on top and places the image below, filling remaining height (disables auto-split).
11. **Panel Left (`panel-left`)**: Theme color fills the left third, from under the top bar to the footer. The title stays in the light area. An image is centered in the colored third.
12. **Panel Right (`panel-right`)**: Same as panel left, with the colored third on the right.

---

## Interactive Presentation Controls

*   **Slide Navigation**: Click side arrow buttons, or use the Keyboard shortcuts: `Right Arrow` / `Space` (Next Slide), `Left Arrow` (Previous Slide), `Home` / `End` (First / Last Slide).
*   **Slide Index Drawer**: Click the hamburger icon in the upper-left to open the Table of Contents drawer and jump to any slide instantly.
*   **Font Scaling**: Use the `A-` and `A+` buttons in the toolbar to shrink or expand text dynamically. Settings are persisted in local storage.
*   **Print / PDF Export**: Click the printer (`🖨️`) button in the toolbar to open the print dialog. Pages are **16:9** full-bleed (same aspect as on-screen slides) for student PDF handouts. Choose **Save as PDF**, **margins: None**, and enable **background graphics**. Leave paper size at the default so it stays 16:9; do not switch to Letter.
*   **Annotations**: Use the floating annotation panel on the right of the stage:
    *   `✏️` **Pen Tool (P)**: Draw in ROI Navy Blue `#003865`.
    *   `🖊️` **Highlighter Tool (H)**: Draw in translucency-blended yellow `#ffeb3b`.
    *   `🧹` **Clear Slide (C)**: Erases drawing on the current slide.
    *   `🗑️` **Delete All**: Resets and clears all annotations across all slides immediately.
    *   Annotation vector strokes are stored and loaded per slide dynamically.

---

## Authoring courses (not in this repo)

This repository is the **slides viewer** (runtime). Course authoring skills, stock images, and instructor docs live in the separate template:

**[roitraining/roi-course-authoring-template](https://github.com/roitraining/roi-course-authoring-template)**

Use that template to create slide courses and labs with an AI coding agent. Do not maintain Course Generator / Lab Generator skills in this viewer repo.

