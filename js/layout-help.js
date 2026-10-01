/* Read-only help for the layout currently selected in the editor. */

export const LAYOUT_HELP = {
    content: {
        title: 'Default content',
        summary: 'A normal teaching slide: one title, then a short dash list. Leave the layout line out. The viewer treats that as this layout.',
        sample: `# Three Ways to Start

- Write the outcome in one sentence
- List the steps in the order you will teach them
- Keep each bullet to one idea`,
        notes: 'The first slide in a chapter is a title slide unless it begins with this line on its own: <!-- layout: content -->'
    },
    title: {
        title: 'Title / cover',
        summary: 'A cover or chapter divider. The picture sits at the top left. The title sits toward the bottom left. A second heading is the subtitle.',
        sample: `<!-- layout: title -->
![Logo](images/logo.png)

# Course name

## A short subtitle`,
        notes: 'The first slide in a chapter uses this layout even when the layout line is missing. Put the layout line alone on the first line. The picture line is an exclamation mark, a description in square brackets, and a file path in parentheses.'
    },
    navigation: {
        title: 'Agenda',
        summary: 'A section menu. Repeat the same list before each section. Bold one item to mark the section you are about to teach. The other items stay plain.',
        sample: `<!-- layout: navigation -->
# Chapter title

- **This section**
- Next section
- Later section`,
        notes: 'Bold is two asterisks on each side of the current item, with no space inside the asterisks. If no item is bold, none of them is marked as the current section.'
    },
    '2-column': {
        title: 'Two columns',
        summary: 'A title, then two side-by-side columns. Each column starts with a level-3 heading. Bullets under that heading stay in that column.',
        sample: `<!-- layout: 2-column -->
# Compare Two Options

### Option A
- First point
- Second point

### Option B
- First point
- Second point

<!-- below-columns -->

> [!NOTE]
> This note spans the full width under both columns.`,
        notes: 'You need at least two ### headings, or the slide stays one block. Put <!-- below-columns --> on a line by itself. Anything after that line spans the full slide. An alert placed before that line stays inside the column above it.'
    },
    '3-column': {
        title: 'Three columns',
        summary: 'A title, then three side-by-side columns. Each column starts with a level-3 heading. Bullets under that heading stay in that column.',
        sample: `<!-- layout: 3-column -->
# Three Parts of the Task

### Prepare
- Gather the source
- Name the outcome

### Do the work
- Follow the steps in order
- Check the result

### Wrap up
- Save the file
- Tell the team

<!-- below-columns -->

> [!NOTE]
> This note spans the full width under all three columns.`,
        notes: 'You need at least two ### headings, or the slide stays one block. Put <!-- below-columns --> on a line by itself. Anything after that line spans the full slide. An alert placed before that line stays inside the column above it.'
    },
    'card-layout': {
        title: 'Cards',
        summary: 'A title, then a row of cards. Each card starts with a level-3 heading. Dash items under that heading become sentences, and the bullets are removed.',
        sample: `<!-- layout: card-layout -->
# Pick a Starting Point

### Plan
- Write the goal before you open the tool.
- Name the person who will use the result.

### Build
- Keep the first version small enough to finish today.
- Show the work to someone else before you add more.

### Review
- Check the result against the goal you wrote first.
- Note one change for the next pass.`,
        notes: 'Write complete sentences, because the dash is removed on the slide. Three cards sit in one row. Four cards use two rows of two. Give each card its own ### heading.'
    },
    stacked: {
        title: 'Stacked image',
        summary: 'Text on top, picture underneath. Use this when a wide picture should sit below the bullets.',
        sample: `<!-- layout: stacked -->
# From Idea to Draft

- Start with the outcome you want
- List the steps in teaching order
- Put the picture under the list

![Simple diagram](images/diagram.png)`,
        notes: 'Put the picture line after the list. The path is relative to the chapter file, usually images/filename.png. The picture file has to be in the course folder or the slide shows a broken image.'
    },
    'title-image': {
        title: 'Title and image',
        summary: 'A visible title with one large picture under it. The picture is scaled to fit inside the slide, so the whole picture stays visible.',
        sample: `<!-- layout: title-image -->
# System Diagram

![System diagram](images/diagram.png)`,
        notes: 'Keep the heading. It is the title students see. One picture line is enough. The path is relative to the chapter file, usually images/filename.png.'
    },
    'image-only': {
        title: 'Image only',
        summary: 'The picture fills the slide area and is scaled to fit. The heading is hidden on the slide. It still names the slide in the slide list. The top bar and footer stay visible.',
        sample: `<!-- layout: image-only -->
# System Diagram

![System diagram](images/diagram.png)`,
        notes: 'Keep the # heading so the slide list has a name. The heading does not appear on the slide. The picture is fit inside the frame, so it is not cropped.'
    },
    'full-bleed': {
        title: 'Full bleed image',
        summary: 'The picture covers the entire slide, including the top bar and footer. It is cropped to fill the frame. The heading is hidden on the slide and still names the slide in the slide list.',
        sample: `<!-- layout: full-bleed -->
# Opening Photo

![Opening photo](images/photo.png)`,
        notes: 'Keep the # heading so the slide list has a name. The top bar and footer are hidden. Choose Image only when those should stay visible and the picture should fit without cropping.'
    },
    'panel-left': {
        title: 'Panel left',
        summary: 'A colored panel fills the left third of the slide. The title and bullets stay in the light area. A picture, if you include one, is centered in the colored panel.',
        sample: `<!-- layout: panel-left -->
# What You Need First

- A quiet place to work
- The handout for this chapter
- Ten minutes of practice time

![Side image](images/side-image.png)`,
        notes: 'The picture line is optional. Without it, the colored third is empty and the title still sits in the light area. Put the picture after the bullets.'
    },
    'panel-right': {
        title: 'Panel right',
        summary: 'A colored panel fills the right third of the slide. The title and bullets stay in the light area. A picture, if you include one, is centered in the colored panel.',
        sample: `<!-- layout: panel-right -->
# Welcome

- Meet the person teaching today
- Skim the goals for this session
- Ask one question before we begin

![Side image](images/side-image.png)`,
        notes: 'The picture line is optional. Without it, the colored third is empty and the title still sits in the light area. Put the picture after the bullets.'
    }
};
