/* Parse and update slide Markdown without reformatting unrelated lines. */

const COURSE_TITLE_RE = /<!--\s*(?:course-title|course_title|course|footer-title|footer_title):\s*(.*?)\s*-->/i;
const LAYOUT_LINE_RE = /^[ \t]*<!--\s*layout:\s*([a-z0-9_-]+)\s*-->[ \t]*$/i;

export const LAYOUT_OPTIONS = [
    { id: 'content', label: 'Default content' },
    { id: 'title', label: 'Title / cover' },
    { id: 'navigation', label: 'Agenda' },
    { id: '2-column', label: 'Two columns' },
    { id: '3-column', label: 'Three columns' },
    { id: 'card-layout', label: 'Cards' },
    { id: 'stacked', label: 'Stacked image' },
    { id: 'title-image', label: 'Title and image' },
    { id: 'image-only', label: 'Image only' },
    { id: 'full-bleed', label: 'Full bleed image' },
    { id: 'panel-left', label: 'Panel left' },
    { id: 'panel-right', label: 'Panel right' }
];

const LAYOUT_ALIASES = {
    content: 'content',
    title: 'title',
    navigation: 'navigation',
    section: 'navigation',
    '2-column': '2-column',
    'two-column': '2-column',
    '3-column': '3-column',
    'three-column': '3-column',
    'card-layout': 'card-layout',
    card: 'card-layout',
    cards: 'card-layout',
    stacked: 'stacked',
    stack: 'stacked',
    'title-image': 'title-image',
    'image-only': 'image-only',
    image: 'image-only',
    image_only: 'image-only',
    'full-bleed': 'full-bleed',
    bleed: 'full-bleed',
    'full-bleed-image': 'full-bleed',
    fullbleed: 'full-bleed',
    'panel-left': 'panel-left',
    'left-panel': 'panel-left',
    panel_left: 'panel-left',
    'panel-right': 'panel-right',
    'right-panel': 'panel-right',
    panel_right: 'panel-right'
};

export const NEW_SLIDE_MARKDOWN = '# New Slide\n\n- ';

export function parseChapter(markdownText) {
    const source = String(markdownText || '').replace(/^\uFEFF/, '');
    const titleMatch = source.match(COURSE_TITLE_RE);
    const courseTitle = titleMatch ? titleMatch[1].trim() : '';
    let body = source;
    if (titleMatch) {
        body = source.replace(titleMatch[0], '');
    }
    body = body.replace(/^\s+/, '');
    const slides = body
        .split(/\r?\n---\r?\n/)
        .map((slide) => slide.trim())
        .filter((slide) => slide.length > 0);
    return { courseTitle, slides };
}

export function serializeChapter(courseTitle, slides) {
    const body = (slides || []).join('\n---\n');
    const title = String(courseTitle || '').trim();
    if (title) {
        return `<!-- course-title: ${title} -->\n\n${body}\n`;
    }
    return body ? `${body}\n` : '';
}

export function slideTitle(markdown, index) {
    const lines = String(markdown || '').split(/\r?\n/);
    for (const line of lines) {
        const clean = line.trim();
        if (clean.startsWith('#')) {
            const title = clean.replace(/^#+\s*/, '').trim();
            if (title) return title;
        }
    }
    return `Slide ${index + 1}`;
}

export function readLayoutId(markdown, slideIndex) {
    const lines = String(markdown || '').split(/\r?\n/);
    for (const line of lines) {
        const match = line.match(LAYOUT_LINE_RE);
        if (match) {
            const raw = match[1].toLowerCase();
            return LAYOUT_ALIASES[raw] || 'content';
        }
    }
    if (slideIndex === 0) return 'title';
    return 'content';
}

function directiveFor(layoutId, slideIndex) {
    if (layoutId === 'content' && slideIndex !== 0) return null;
    if (layoutId === 'content') return 'content';
    const known = LAYOUT_OPTIONS.some((option) => option.id === layoutId);
    return known ? layoutId : null;
}

export function setLayoutLine(markdown, layoutId, slideIndex) {
    const desired = directiveFor(layoutId, slideIndex);
    const lines = String(markdown || '').split(/\r?\n/);
    const index = lines.findIndex((line) => LAYOUT_LINE_RE.test(line));

    if (desired === null) {
        if (index === -1) return String(markdown || '');
        lines.splice(index, 1);
        return lines.join('\n').replace(/^\n/, '');
    }

    const line = `<!-- layout: ${desired} -->`;
    if (index === -1) {
        const rest = lines.join('\n').replace(/^\n+/, '');
        return rest ? `${line}\n${rest}` : line;
    }
    if (lines[index].trim() === line) {
        return lines.join('\n');
    }
    lines[index] = line;
    return lines.join('\n');
}

function imageAltFromPath(relPath) {
    const file = String(relPath || '').split('/').pop() || 'Image';
    return file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'Image';
}

/**
 * Replace the first Markdown image outside a code fence, or append one.
 * Other lines are unchanged.
 */
export function setSlideImage(markdown, relPath) {
    const altFromPath = imageAltFromPath(relPath);
    const imageRe = /!\[([^\]]*)\]\(([^)\s]+)(?:\s+"[^"]*")?\)/;
    const lines = String(markdown || '').split(/\r?\n/);
    let inFence = false;
    let replaced = false;

    const next = lines.map((line) => {
        if (/^[ \t]*```/.test(line)) {
            inFence = !inFence;
            return line;
        }
        if (inFence || replaced) return line;
        if (!imageRe.test(line)) return line;
        replaced = true;
        return line.replace(imageRe, (_match, alt) => `![${alt || altFromPath}](${relPath})`);
    });

    if (replaced) return next.join('\n');

    const text = lines.join('\n').replace(/\s*$/, '');
    const imageLine = `![${altFromPath}](${relPath})`;
    return text ? `${text}\n\n${imageLine}` : imageLine;
}
