# Course Generator Slide Layout Templates

Copy and paste these templates to construct slides for the HTML Slides Viewer.

---

## 1. Title Slide Layout
Use this for course cover pages and chapter dividers.

```markdown
<!-- layout: title -->
![Logo](images/roi-logo-with-name.png)

# Course Title or Chapter Number
## Subtitle or Topic
```

---

## 2. Default Content Layout
Standard top-to-bottom layout. Optional callouts.

```markdown
# Slide Title

- **Point 1**: Bullet point description.
- **Point 2**: Bullet point description.

> [!NOTE]
> Add helpful auxiliary tips or background info here.
```

---

## 3. Navigation Agenda Layout
 Agenda slides with concept listing. Bold the active concept.

```markdown
<!-- layout: navigation -->
# Agenda Topic

- **Active Topic (Bolds in black)**
- Inactive Topic (Mutes to grey)
- Another Inactive Topic
```

---

## 4. Auto-Split Column Layout
Splits slide automatically into 2 columns. Do not add a layout comment.

```markdown
# Auto-Split Layout Slide

- **Feature A**: Description of the feature.
- **Feature B**: Description of another feature.

![Visual Diagram](images/sample-diagram.png)
```

---

## 5. Custom Two-Column Layout
Creates 2 vertical text columns starting at each H3 subheader.

```markdown
<!-- layout: 2-column -->
# Title of 2-Column Slide

### Left Column Title
- Bullet point 1
- Bullet point 2

### Right Column Title
- Bullet point 1
- Bullet point 2
```

---

## 6. Custom Three-Column Layout
Creates 3 vertical text columns starting at each H3 subheader.

```markdown
<!-- layout: 3-column -->
# Title of 3-Column Slide

### Column A Title
- Bullet point 1
- Bullet point 2

### Column B Title
- Bullet point 1
- Bullet point 2

### Column C Title
- Bullet point 1
- Bullet point 2
```

---

## 7. Title-Image Immersive Layout
Centers and scales a single diagram image to fill all vertical space.

```markdown
<!-- layout: title-image -->
# Immersive Architecture Diagram

![System Diagram](images/sample-diagram.png)
```
