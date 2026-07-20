# Chapter 1: Introduction to Web Development

Welcome to **Web Development 101**!

This presentation viewer dynamically renders Markdown files into slides.

- Lightweight & Fast
- GitHub Pages Compatible
- Keyboard & Touch Navigation

---

# Course Agenda

In this chapter, we will cover:

1. **HTML5** Structure & Semantics
2. **CSS3** Modern Styling & Layouts
3. **JavaScript** Interactive Logic & APIs
4. Deploying applications to **GitHub Pages**

> [!NOTE]
> Use the **Left/Right Arrow keys** or **Next/Prev buttons** below to navigate through the slides.

---

# Key Concept: The Web Stack

| Layer | Technology | Primary Purpose |
| :--- | :--- | :--- |
| **Content & Structure** | HTML | Defines document elements and semantic layout |
| **Presentation & Style** | CSS | Controls colors, fonts, responsive grids, and animation |
| **Behavior & Logic** | JavaScript | Manages interactivity, network requests, and DOM updates |

> [!TIP]
> Always separate content (HTML) from presentation (CSS) for maximum code maintainability!

---

# Hands-on Code Example

Here is how we fetch and process data in modern JavaScript:

```javascript
async function loadCourseContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response failed');
        const markdown = await response.text();
        return markdown.split(/\n---\n/);
    } catch (error) {
        console.error('Failed to load slides:', error);
    }
}
```

> [!IMPORTANT]
> Click the **Copy** button on the top right of any code snippet to copy the code directly to your clipboard!

---

# Responsive Design Principles

> Responsive Web Design makes your web page look good on all devices.

> [!WARNING]
> Mobile-first design is no longer optional—over 60% of web traffic comes from mobile devices!

### Best Practices:
* Use **fluid grid layouts** and relative units (`rem`, `%`, `vh`).
* Implement **CSS Container Queries** and **Media Queries**.
* Test tap targets for touch accessibility (minimum `48px` size).

---

# Chapter Summary & Next Steps

### What we learned today:
- How HTML, CSS, and JavaScript work together.
- Structuring presentations cleanly using Markdown.
- Delivering slide decks directly from GitHub repositories.

> [!CAUTION]
> Don't forget to push your code changes to Git before deploying to production!

**Thank you for participating!** Proceed to Chapter 2 for hands-on exercises.
