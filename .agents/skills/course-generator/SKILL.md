---
name: course-generator
description: Design, outline, structure, and write complete slide decks in Markdown format compatible with the HTML Slides Viewer. Includes heuristics for layout selection, pedagogical guidelines, and syntax formatting rules.
---

# Course Generator Skill

Use this skill when the user requests to create a new presentation, draft slide contents, convert documents into slide decks, or structure educational topics.

---

## 1. Slide Layout Selection Matrix
Choose the correct layout directive depending on the primary purpose of each slide:

| Layout Name | Directive | Trigger Heuristic / Best Use Case |
| :--- | :--- | :--- |
| **Title** | `<!-- layout: title -->` | Slide 1 (Course opener) and any Chapter Divider slides. Centers branding and titles. |
| **Navigation** | `<!-- layout: navigation -->` | Agenda or Table of Concepts slides at the start of a chapter. Bolds the current active topic. |
| **Two-Column Custom** | `<!-- layout: two-column -->` | Comparing two distinct items, pros/cons, or showing parallel concepts side-by-side. |
| **Three-Column** | `<!-- layout: three-column -->` | Side-by-side comparison of three columns (e.g. AWS vs Azure vs GCP features). |
| **Title-Image** | `<!-- layout: title-image -->` | Displays a single large architecture diagram, mockup, or infographic. Scales image to 100% remaining height. |
| **Auto-Split (2-Col)**| (Omit directive) | Standard slides containing BOTH a list and an image. Splits list (left) and image (right). |
| **Content** | (Omit directive) | Standard bullet points, code blocks, or tables flowing vertically from top to bottom. |

---

## 2. Pedagogical Guidelines (Creating Quality Content)
*   **The 6x6 Rule**: Limit slides to a maximum of 6 bullet points, with each bullet containing no more than 6-8 words where possible. Keep slides concise.
*   **Avoid Walls of Text**: Never write long paragraphs. Break information down into bullet points, tables, or columns.
*   **Visual Variety**: Alternate layouts throughout the course deck to keep students engaged. Do not repeat the default vertical layout 5 times in a row.
*   **Active Learning**: Conclude every major chapter with an interactive Hands-On Activity/Lab slide detailing instructions and links.

---

## 3. Strict Markdown Syntax Constraints
*   **NO Nested Comments**: Do NOT put explanatory HTML comments inside other comments. For example:
    *   *Incorrect*: `<!-- layout: title <!-- Centered Cover --> -->`
    *   *Correct*: Keep layout comments entirely clean: `<!-- layout: title -->`
*   **Slide Separator**: Use `---` on a blank line to denote a slide transition.
*   **Course Title**: Always include `<!-- course-title: [Title] -->` at the very top of the markdown file.
*   **Active Concepts in Navigation**: For navigation slides, wrap exactly one list item in bold double asterisks (e.g. `- **Active Topic**`). The app automatically bolds this item and mutes all others to grey.
*   **GitHub-Style Alerts**: Enhance slides using:
    *   `> [!NOTE]` (general advice/facts)
    *   `> [!TIP]` (helpful shortcuts)
    *   `> [!WARNING]` (potential pitfalls)
    *   `> [!IMPORTANT]` (critical warnings)
*   **Code Blocks**: Specify the syntax language (e.g. ````javascript` or ````hcl`) to ensure syntax highlighting and copy buttons function correctly.

---

## 4. Templates Reference
Refer to the layout templates in [examples/layout-templates.md](examples/layout-templates.md) for copy-paste examples of each layout.
