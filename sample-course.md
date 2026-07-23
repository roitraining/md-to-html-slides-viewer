<!-- 
  COURSE TITLE METADATA:
  The course-title comment below sets the title text displayed in the 
  left column of the footer across all slides in this deck.
-->
<!-- course-title: 123: Sample Course -->

<!-- 
  SLIDE 1: Course Cover Slide
  Layout Type: "title"
  Activation: Include the comment "layout: title" on its own line.
  Usage: Centers all text and graphics, hides the slide progress header, 
  and styles the cover slide.
-->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

# Course 123:
# Sample Course Layout Demonstration

---

<!-- 
  SLIDE 2: Default / Content Layout Slide
  Layout Type: "content" (Default)
  Activation: Leave blank or omit layout directives.
  Usage: Text and lists flow vertically. Standard for general information slides.
-->
# Default Slide Layout

This slide demonstrates the default **content** layout. When no layout directive is specified, content flows vertically from top to bottom.

### Markdown Features Supported:
- **Bold Text** and *Italic Text*
- Bullet points (like this list)
- Subheaders (`###` or `##` tags)
- Callouts / Alerts (see below)

> [!NOTE]
> This is a NOTE alert callout. Use it to highlight auxiliary tips, background context, or interesting facts.

---

<!-- 
  SLIDE 3: Chapter Divider Cover Slide
  Layout Type: "title"
  Activation: Include "layout: title" on its own line.
  Usage: Centers all text. Perfect for separating the course into logical modules or chapters.
-->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

123: Sample Course

# Chapter 1: Standard & Split Layouts

---

<!-- 
  SLIDE 4: Chapter Agenda / Navigation Layout Slide
  Layout Type: "navigation"
  Activation: Include "layout: navigation" on its own line.
  Usage: Creates an agenda/table of contents layout.
  Active Concept Highlighting: 
    The presentation app scans list items on navigation slides. 
    The item wrapped in bold asterisks (e.g. **Topic**) automatically renders in 
    bold black text, while all other topics render in a muted light grey.
-->
<!-- layout: navigation -->
# Agenda: Part 1

- **Introduction to Layouts**
- Default & Content Slides
- Auto-Split Layouts
- Three-Column Layout
- Immersive Image Layout

---

<!-- 
  SLIDE 5: 2-Column Auto-Split Layout Slide
  Layout Type: "split" (Triggered Automatically)
  Activation: Default layout (no layout directive) containing BOTH a bullet list and an image.
  Usage: The app automatically detects this combination and builds a 2-column layout
         with the bullet list on the left and the image centered on the right.
-->
# Auto-Split Layout (2-Columns)

- **Layout Detection**: No explicit layout directive is required for this effect.
- **Left Column**: The first bullet list (`ul` or `ol`) is automatically placed here.
- **Right Column**: The first image (`img`) is automatically placed here.
- **Use Case**: Great for showing text descriptions next to supporting diagrams or screenshots.

![Sample Diagram](images/sample-diagram.png)

---

<!-- 
  SLIDE 6: Chapter Agenda / Navigation Layout Slide (Topic 2 Active)
  Layout Type: "navigation"
  Activation: Include "layout: navigation" on its own line.
  Usage: Highlights the second topic: "Default & Content Slides".
-->
<!-- layout: navigation -->
# Agenda: Part 1

- Introduction to Layouts
- **Default & Content Slides**
- Auto-Split Layouts
- Three-Column Layout
- Immersive Image Layout

---

<!-- 
  SLIDE 7: Chapter 2 Divider Cover Slide
  Layout Type: "title"
  Activation: Include "layout: title" on its own line.
-->
<!-- layout: title -->
![ROI Logo](images/roi-logo-with-name.png)

123: Sample Course

# Chapter 2: Advanced Columns & Large Media

---

<!-- 
  SLIDE 8: Two-Column Custom Layout Slide
  Layout Type: "two-column" (or "2-column")
  Activation: Include the comment "layout: two-column" or "layout: 2-column" on its own line.
  Usage: Splits `the slide into two equal vertical columns below the title.
  Structure: 
    Start each column with a subheader (e.g. H3 headers like ### Column A) 
    followed by the list items or paragraphs belonging to that column.
    This is different from "split" layout because it supports pure text columns (no images required).
-->
<!-- layout: 2-column -->
# Side-by-Side Topics (2 Columns)

### Left Column
- **Independent**: Standard text/lists only
- **No Image Required**: Great for parallel concepts
- **Clean Structure**: Automatically parsed by subheaders

### Right Column
- **Symmetric**: Proportions are equal to the left column
- **Easy Comparison**: Readily compare two alternatives
- **Responsive**: Flex layout wraps gracefully

---

<!-- 
  SLIDE 9: Three-Column Layout Slide
  Layout Type: "three-column"
  Activation: Include "layout: three-column" or "layout: 3-column" on its own line.
  Usage: Splits the slide into three equal vertical columns below the title.
  Structure: 
    Start each column with a subheader (e.g. H3 headers like ### Option A) 
    followed by the list items or paragraphs belonging to that column.
-->
<!-- layout: three-column -->
# Comparing Features (3 Columns)

### Column A
- **Flexibility**: Define layout columns cleanly
- **Alignment**: Columns align horizontally
- **Styling**: Accent borders match theme

### Column B
- **Spacing**: Generous gap between columns
- **Readability**: Perfect for side-by-side comparisons
- **Adaptability**: Adjusts on screen resize

### Column C
- **Auto-grouping**: Handled by JavaScript
- **Clean Markdown**: Simple headers and lists
- **Responsive**: Adapts to mobile/desktop

---

<!-- 
  SLIDE 10: Title-Image Immersive Layout Slide
  Layout Type: "title-image"
  Activation: Include "layout: title-image" on its own line.
  Usage: Showcases a single large diagram, mockup, or infographic.
  Design details:
    The title sits at the top of the slide, and the single image is scaled 
    using "object-fit: contain" to fill 100% of the remaining vertical space 
    between the title and the footer without vertical overflow or scrollbars.
-->
<!-- layout: title-image -->
# High-Resolution Immersive Image

![Immersive Slide Diagram](images/sample-diagram.png)

---

<!-- 
  SLIDE 11: Code Blocks & Callouts Demo Slide
  Layout Type: "content" (Default)
  Activation: Omit layout directives.
  Usage: Demonstrates how code blocks and GitHub-style alerts are rendered.
  Features:
    - Code blocks automatically get a "Copy" button in the upper-right corner.
    - Multiple alert styles (TIP, IMPORTANT, WARNING, CAUTION) are fully supported.
-->
# Code Blocks & Rich Callouts

Here is a block of code with syntax highlighting and a copy button:

```javascript
// A simple JavaScript function
function showStatus(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Status: ${message}`);
}
```

> [!TIP]
> Use TIP alerts to highlight helpful suggestions or productivity shortcuts.

> [!WARNING]
> Use WARNING alerts to warn users about potential mistakes, gotchas, or security considerations.

---

<!-- 
  SLIDE 12: Tables Slide
  Layout Type: "content" (Default)
  Activation: Omit layout directives.
  Usage: Showcases clean alignment of markdown tables.
-->
# Layout Reference Cheat Sheet

Here is a summary of all layouts supported in this slide engine:

| Layout Name | Directive Comment | Main Design Behavior |
| :--- | :--- | :--- |
| **Title** | `layout: title` | Centers all content; hides header/footer. |
| **Content** | (None / Default) | Single column top-to-bottom layout. |
| **Navigation** | `layout: navigation` | Chapter list; active concept highlighted in bold. |
| **Auto-Split** | (Automatic) | Triggers automatically if image + bullets are present. |
| **Three Column** | `layout: three-column` | Creates 3 side-by-side vertical columns. |
| **Title Image** | `layout: title-image` | Immersive view; image scales to fill remaining height. |

---

<!-- 
  SLIDE 13: Hands-On Activity Slide
  Layout Type: "content" (Default)
  Activation: Omit layout directives.
-->
# Hands-On Lab Exercise

**Duration**: 15 minutes

### Follow these steps to complete the layout activity:
1. Open the course markdown file in your text editor.
2. Add a new slide separated by a triple-dash (`---`).
3. Experiment with different layout directives.
4. Refresh the viewer page to see your changes immediately.

- [View Lab Guide](https://roitraining.github.io/md-to-html-lab-viewer/)

---


<!-- 
  SLIDE 14: Summary / Wrap-up Slide
  Layout Type: "content" (Default)
  Activation: Omit layout directives.
-->
# Course Wrap-Up

### Key Concepts Covered:
1. Writing slides using simple Markdown and HTML comment directives
2. Utilizing the correct layout for different presentation styles
3. Presenting code blocks and tables elegantly
4. Working with vertical & split layouts
