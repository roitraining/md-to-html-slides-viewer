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

---

## Getting Started

### Structure Your Markdown
Slides are written in Markdown. Use a triple-dash (`---`) on its own line to separate slides. Customize slide properties using HTML comments:
*   Set course footer title (at top of file): `<!-- course-title: My Slide Course -->`
*   Set slide layouts: `<!-- layout: title -->`, `<!-- layout: navigation -->`, `<!-- layout: 2-column -->`, `<!-- layout: 3-column -->`, or `<!-- layout: title-image -->`.

---

## Slides & Layout Directives

The presentation engine supports the following layout types:
1.  **Cover Slide (`title`)**: Centers header text, subtitle, and logos.
2.  **Default Content (`content`)**: Flows vertically. Supports markdown tables, list blocks, code formatting, and alert blockquotes (`[!NOTE]`, `[!TIP]`, `[!WARNING]`, `[!IMPORTANT]`).
3.  **Agenda Agenda (`navigation`)**: Splits the slide into active topics highlighted in bold black, with others muted to light grey.
4.  **Auto-Split (2-Column)**: Triggered automatically in standard content layout if both a list and an image are present on a slide (bullets left, image right).
5.  **Custom Columns (`2-column` and `3-column`)**: Separates slide content into equal side-by-side vertical flex columns, starting at each subheader (`h3`, `h2`, or `h4`).
6.  **Immersive Media (`title-image`)**: Displays a title and scales a single diagram image to fill all remaining vertical viewport space without overflow.

---

## Interactive Presentation Controls

*   **Slide Navigation**: Click side arrow buttons, or use the Keyboard shortcuts: `Right Arrow` / `Space` (Next Slide), `Left Arrow` (Previous Slide), `Home` / `End` (First / Last Slide).
*   **Slide Index Drawer**: Click the hamburger icon in the upper-left to open the Table of Contents drawer and jump to any slide instantly.
*   **Font Scaling**: Use the `A-` and `A+` buttons in the toolbar to shrink or expand text dynamically. Settings are persisted in local storage.
*   **Print / PDF Export**: Click the printer (`🖨️`) button in the toolbar to open the print dialog. Ensure the layout is set to **Landscape** with **margins set to None/Default** and **background graphics enabled**.
*   **Annotations**: Use the floating annotation panel on the right of the stage:
    *   `✏️` **Pen Tool (P)**: Draw in ROI Navy Blue `#003865`.
    *   `🖊️` **Highlighter Tool (H)**: Draw in translucency-blended yellow `#ffeb3b`.
    *   `🧹` **Clear Slide (C)**: Erases drawing on the current slide.
    *   `🗑️` **Delete All**: Resets and clears all annotations across all slides immediately.
    *   Annotation vector strokes are stored and loaded per slide dynamically.

---

## AI Agent Customization: Course Generator Skill

This project includes a **Course Generator Skill** designed to teach AI assistants how to structure and write high-quality, compiler-compliant courses for this slide viewer. You can configure this globally on your computer so that your AI assistant can help you build new slide decks in *any* directory.

The Customization Skill consists of:
*   Instructions: [`.agents/skills/course-generator/SKILL.md`](.agents/skills/course-generator/SKILL.md)
*   Templates: [`.agents/skills/course-generator/examples/layout-templates.md`](.agents/skills/course-generator/examples/layout-templates.md)

---

## Global Setup Instructions for AI Agents

Follow these setup steps to make the Course Generator guidelines available to your AI assistant globally:

### 1. Antigravity Setup (Automatic Discovery)
Antigravity automatically scans your system-wide customizations directory.
1. Copy the skill folder to your global Antigravity config directory:
   ```bash
   mkdir -p ~/.gemini/config/skills/
   cp -R .agents/skills/course-generator ~/.gemini/config/skills/
   ```
2. Antigravity will now automatically load and apply these layout guidelines and templates whenever you ask it to create or edit slides on your machine.

### 2. Visual Studio Code / GitHub Copilot Setup
You can instruct VS Code's Copilot to read the slide deck guidelines automatically for every workspace on your machine:
1. Open VS Code.
2. Open your User Settings JSON (`Cmd + Shift + P` $\rightarrow$ type `Preferences: Open User Settings (JSON)`).
3. Add the following line to your settings object (replace `/Users/YOUR_NAME` with your actual user home path):
   ```json
   "github.copilot.chat.customInstructions.file": "/Users/YOUR_NAME/.gemini/config/skills/course-generator/SKILL.md"
   ```
4. Save the file. Copilot will now load these instructions globally for all chats and completions.

### 3. Cursor Setup
Cursor allows you to define global rules for its AI engine:
1. Open Cursor's settings GUI (`Cmd + ,` or the gear icon in the top right).
2. Navigate to **General** $\rightarrow$ **Rules for AI**.
3. Open [`SKILL.md`](.agents/skills/course-generator/SKILL.md) in your editor and copy the entire text.
4. Paste the content into Cursor's **Rules for AI** input box.
5. Save settings. Cursor will now apply these guidelines to every project you open.

