/* Build one editable PowerPoint file from a chapter's slides.
   Each slide is rendered with the viewer's layout pipeline, then the
   measured boxes are replayed as native text, shapes, and images.
   Colors and fonts come from the theme currently set on <html data-theme>. */

import { renderSlideInto } from './render-slide.js?v=47';

const SLIDE_W = 13.333;
const SLIDE_H = 7.5;
const PX_PER_IN = 96;

const GENERIC_FONTS = new Set([
    'system-ui',
    'sans-serif',
    'serif',
    'monospace',
    'ui-monospace',
    'ui-sans-serif',
    'ui-serif',
    '-apple-system',
    'blinkmacsystemfont'
]);

function round3(value) {
    return Math.round(value * 1000) / 1000;
}

function cssColor(value) {
    const text = String(value || '').trim();
    const hex = text.match(/^#([0-9a-f]{3,8})$/i);
    if (hex) {
        let digits = hex[1];
        if (digits.length === 3) digits = digits.split('').map((ch) => ch + ch).join('');
        return { hex: digits.slice(0, 6).toUpperCase(), alpha: 1 };
    }
    const rgb = text.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
    if (!rgb) return null;
    const alpha = rgb[4] === undefined ? 1 : parseFloat(rgb[4]);
    if (Number.isNaN(alpha)) return null;
    const digits = [rgb[1], rgb[2], rgb[3]]
        .map((part) => Math.max(0, Math.min(255, parseInt(part, 10))).toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase();
    return { hex: digits, alpha };
}

function blendOver(color, backgroundHex) {
    if (!color || color.alpha < 0.02) return null;
    if (color.alpha >= 0.98) return color.hex;
    const bg = cssColor(`#${backgroundHex}`) || { hex: 'FFFFFF', alpha: 1 };
    const fg = {
        r: parseInt(color.hex.slice(0, 2), 16),
        g: parseInt(color.hex.slice(2, 4), 16),
        b: parseInt(color.hex.slice(4, 6), 16)
    };
    const base = {
        r: parseInt(bg.hex.slice(0, 2), 16),
        g: parseInt(bg.hex.slice(2, 4), 16),
        b: parseInt(bg.hex.slice(4, 6), 16)
    };
    const mix = (channel) => Math.round(fg[channel] * color.alpha + base[channel] * (1 - color.alpha));
    return [mix('r'), mix('g'), mix('b')].map((part) => part.toString(16).padStart(2, '0')).join('').toUpperCase();
}

function firstGradientColor(image) {
    const text = String(image || '');
    if (!text.includes('gradient')) return null;
    const hex = text.match(/#([0-9a-f]{3,8})/i);
    if (hex) return cssColor(`#${hex[1]}`);
    const rgb = text.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/i);
    return rgb ? cssColor(rgb[0]) : null;
}

function visibleColor(value) {
    const color = cssColor(value);
    if (!color || color.alpha < 0.02) return null;
    return color;
}

function fillHex(style, backgroundHex) {
    const painted = visibleColor(style.backgroundColor) || firstGradientColor(style.backgroundImage);
    return blendOver(painted, backgroundHex || 'FFFFFF');
}

function themeHex(name, fallback) {
    const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
    const color = cssColor(raw.trim());
    if (color && color.alpha > 0.5) return color.hex;
    const gradient = firstGradientColor(raw);
    if (gradient) return gradient.hex;
    return fallback;
}

function fontFace(style) {
    const families = String(style.fontFamily || '').split(',');
    for (const family of families) {
        const name = family.trim().replace(/^["']|["']$/g, '');
        if (!name || GENERIC_FONTS.has(name.toLowerCase())) continue;
        return name;
    }
    return 'Calibri';
}

function fontPt(style) {
    const px = parseFloat(style.fontSize);
    if (!px) return 12;
    // Boxes are measured in inches (96 CSS px = 1 in = 72 pt). Using the
    // pixel number as the point size draws the letters a third larger than
    // those boxes, so a wrapped bullet runs into the next one.
    return Math.max(8, Math.round(px * 0.75 * 10) / 10);
}

function lineSpacingPt(style) {
    const raw = style.lineHeight;
    if (!raw || raw === 'normal') return undefined;
    const px = parseFloat(raw);
    if (!px) return undefined;
    return Math.round(px * 0.75 * 10) / 10;
}

function fontWeight(style) {
    if (style.fontWeight === 'bold') return 700;
    if (style.fontWeight === 'normal') return 400;
    return parseInt(style.fontWeight, 10) || 400;
}

function textAlign(el, style) {
    if (style.textAlign === 'center' || style.textAlign === 'right') return style.textAlign;
    if (style.justifyContent === 'center') return 'center';
    if (style.justifyContent === 'flex-end' || style.justifyContent === 'end') return 'right';
    return 'left';
}

function textValign(style) {
    if (style.alignItems === 'center' || style.verticalAlign === 'middle') return 'middle';
    return 'top';
}

function isHidden(el) {
    if (!el || el.hidden || el.getAttribute('aria-hidden') === 'true') return true;
    const style = getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return true;
    const rect = el.getBoundingClientRect();
    return rect.width < 1 || rect.height < 1;
}

function borderBox(el, origin) {
    const rect = el.getBoundingClientRect();
    const box = {
        x: (rect.left - origin.left) / PX_PER_IN,
        y: (rect.top - origin.top) / PX_PER_IN,
        w: rect.width / PX_PER_IN,
        h: rect.height / PX_PER_IN
    };
    if (box.x < 0) {
        box.w += box.x;
        box.x = 0;
    }
    if (box.y < 0) {
        box.h += box.y;
        box.y = 0;
    }
    if (box.x + box.w > SLIDE_W) box.w = SLIDE_W - box.x;
    if (box.y + box.h > SLIDE_H) box.h = SLIDE_H - box.y;
    if (box.w < 0.04 || box.h < 0.04) return null;
    return {
        x: round3(box.x),
        y: round3(box.y),
        w: round3(box.w),
        h: round3(box.h)
    };
}

function contentBox(el, origin) {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const padL = parseFloat(style.paddingLeft) || 0;
    const padR = parseFloat(style.paddingRight) || 0;
    const padT = parseFloat(style.paddingTop) || 0;
    const padB = parseFloat(style.paddingBottom) || 0;
    const box = {
        x: (rect.left - origin.left + padL) / PX_PER_IN,
        y: (rect.top - origin.top + padT) / PX_PER_IN,
        w: (rect.width - padL - padR) / PX_PER_IN,
        h: (rect.height - padT - padB) / PX_PER_IN
    };
    if (box.w < 0.04 || box.h < 0.04) return borderBox(el, origin);
    if (box.x < 0) box.x = 0;
    if (box.y < 0) box.y = 0;
    if (box.x + box.w > SLIDE_W) box.w = SLIDE_W - box.x;
    if (box.y + box.h > SLIDE_H) box.h = SLIDE_H - box.y;
    if (box.w < 0.04 || box.h < 0.04) return null;
    return {
        x: round3(box.x),
        y: round3(box.y),
        w: round3(box.w),
        h: round3(box.h)
    };
}

function runOptions(style) {
    const options = {
        fontSize: fontPt(style),
        fontFace: fontFace(style),
        color: (cssColor(style.color) || { hex: '1A1A1A' }).hex,
        bold: fontWeight(style) >= 600
    };
    if (style.fontStyle === 'italic') options.italic = true;
    if (String(style.textDecorationLine || '').includes('underline')) {
        options.underline = { style: 'sng' };
    }
    return options;
}

function runsFrom(el) {
    const runs = [];
    function push(text, style, breakLine) {
        const options = runOptions(style);
        if (breakLine) options.breakLine = true;
        runs.push({ text, options });
    }
    function walk(node, preformatted) {
        if (node.nodeType === Node.TEXT_NODE) {
            const style = getComputedStyle(node.parentElement || el);
            const raw = node.textContent || '';
            if (preformatted) {
                const lines = raw.split('\n');
                lines.forEach((line, index) => {
                    const last = index === lines.length - 1;
                    if (!line && last) return;
                    push(line || ' ', style, !last);
                });
                return;
            }
            const text = raw.replace(/\s+/g, ' ');
            if (!text || (text === ' ' && !runs.length)) return;
            push(text, style, false);
            return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        if (node.tagName === 'SVG' || node.classList.contains('octicon') || node.classList.contains('copy-btn')) return;
        if (node.tagName === 'BR') {
            push('', getComputedStyle(node.parentElement || el), true);
            return;
        }
        if (node.tagName === 'UL' || node.tagName === 'OL') return;
        const pre = preformatted || node.tagName === 'PRE' || node.tagName === 'CODE';
        node.childNodes.forEach((child) => walk(child, pre));
    }
    walk(el, el.tagName === 'PRE');
    return runs.filter((run) => run.text || run.options.breakLine);
}

function hasVisibleText(runs) {
    return runs.some((run) => run.text && run.text.trim());
}

function addRect(slide, box, color, radius) {
    if (!box || !color) return;
    const options = {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        fill: { color }
    };
    if (radius && radius > 0.01) {
        slide.addShape('roundRect', { ...options, rectRadius: round3(radius) });
        return;
    }
    slide.addShape('rect', options);
}

function paintBackgrounds(slide, card) {
    const origin = card.getBoundingClientRect();
    const slideBg = fillHex(getComputedStyle(card), 'FFFFFF') || 'FFFFFF';
    addRect(slide, { x: 0, y: 0, w: SLIDE_W, h: SLIDE_H }, slideBg);

    card.querySelectorAll('.slide-top-bar, .slide-panel, .content-card, .markdown-alert, pre, .footer-number').forEach((el) => {
        if (isHidden(el)) return;
        const box = borderBox(el, origin);
        if (!box) return;
        const style = getComputedStyle(el);
        const fill = fillHex(style, slideBg);
        const radius = (parseFloat(style.borderTopLeftRadius) || 0) / PX_PER_IN;
        if (fill && fill !== slideBg) addRect(slide, box, fill, radius);
        if (el.classList.contains('markdown-alert')) {
            const border = cssColor(style.borderLeftColor);
            const width = (parseFloat(style.borderLeftWidth) || 0) / PX_PER_IN;
            if (border && width >= 0.02) {
                addRect(slide, { x: box.x, y: box.y, w: round3(width), h: box.h }, border.hex);
            }
        }
        if (el.classList.contains('content-card')) {
            addRect(slide, { x: box.x, y: box.y, w: box.w, h: round3(6 / PX_PER_IN) }, themeHex('--slide-accent', '003865'));
        }
    });
    return origin;
}

function addTextBlock(slide, el, origin) {
    if (el.closest('table')) return;
    if (el.tagName === 'P' && (el.closest('li') || el.closest('pre'))) return;
    if (/^H[1-6]$/.test(el.tagName) && el.closest('li')) return;
    if (isHidden(el)) return;
    const runs = runsFrom(el);
    if (!hasVisibleText(runs)) return;
    const box = contentBox(el, origin);
    if (!box) return;
    // Keep the measured height. Extra height spills into the next bullet.
    // Do not autofit: PowerPoint's shrink-to-fit makes the type smaller than the viewer.
    const style = getComputedStyle(el);
    const options = {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        margin: 0,
        isTextBox: true,
        align: textAlign(el, style),
        valign: textValign(style),
        fontFace: fontFace(style),
        fontSize: fontPt(style),
        color: (cssColor(style.color) || { hex: '1A1A1A' }).hex
    };
    const lineSpacing = lineSpacingPt(style);
    if (lineSpacing) options.lineSpacing = lineSpacing;
    if (el.tagName === 'LI') {
        const list = style.listStyleType;
        if (list && list !== 'none') {
            const parent = el.parentElement;
            const pad = parent ? (parseFloat(getComputedStyle(parent).paddingLeft) || 0) : 0;
            // Keep the text column as wide as the measured line. PowerPoint's
            // own bullet indent would narrow it and wrap an extra line.
            const indentPt = Math.max(12, Math.round((pad || 32) * 0.75 * 10) / 10);
            const numbered = parent && parent.tagName === 'OL';
            options.bullet = numbered ? { type: 'number', indent: indentPt } : { indent: indentPt };
            const indentIn = indentPt / 72;
            const x = Math.max(0, options.x - indentIn);
            options.w = round3(options.w + (options.x - x));
            options.x = round3(x);
        }
    }
    slide.addText(runs, options);

    const borderBottom = parseFloat(style.borderBottomWidth) || 0;
    const borderColor = cssColor(style.borderBottomColor);
    if (borderBottom >= 1 && borderColor && borderColor.alpha > 0.4) {
        const rule = borderBox(el, origin);
        if (rule) {
            slide.addShape('rect', {
                x: rule.x,
                y: round3(rule.y + rule.h - borderBottom / PX_PER_IN),
                w: rule.w,
                h: round3(Math.max(borderBottom / PX_PER_IN, 0.01)),
                fill: { color: borderColor.hex }
            });
        }
    }
}

async function rasterize(img) {
    const width = img.naturalWidth || img.width;
    const height = img.naturalHeight || img.height;
    if (!width || !height) return null;
    const scale = Math.min(1, 1920 / Math.max(width, height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = canvas.getContext('2d');
    try {
        context.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const comma = dataUrl.indexOf(',');
        return `image/png;base64,${dataUrl.slice(comma + 1)}`;
    } catch (_) {
        return null;
    }
}

async function addImages(slide, card, origin) {
    const images = [...card.querySelectorAll('img')];
    for (const img of images) {
        if (isHidden(img)) continue;
        const box = borderBox(img, origin);
        const data = box ? await rasterize(img) : null;
        if (!box || !data) continue;
        slide.addImage({ data, x: box.x, y: box.y, w: box.w, h: box.h });
    }
}

function addTables(slide, card, origin) {
    card.querySelectorAll('table').forEach((table) => {
        if (isHidden(table)) return;
        const box = borderBox(table, origin);
        if (!box) return;
        const rows = [];
        table.querySelectorAll('tr').forEach((tr) => {
            const row = [];
            tr.querySelectorAll('th, td').forEach((cell) => {
                const style = getComputedStyle(cell);
                const fill = fillHex(style, 'FFFFFF') || 'FFFFFF';
                row.push({
                    text: cell.textContent.replace(/\s+/g, ' ').trim(),
                    options: {
                        fill: { color: fill },
                        color: (cssColor(style.color) || { hex: '1A1A1A' }).hex,
                        bold: fontWeight(style) >= 600,
                        align: textAlign(cell, style),
                        valign: 'middle',
                        fontFace: fontFace(style),
                        fontSize: fontPt(style),
                        margin: 4
                    }
                });
            });
            if (row.length) rows.push(row);
        });
        if (!rows.length) return;
        const style = getComputedStyle(table);
        slide.addTable(rows, {
            x: box.x,
            y: box.y,
            w: box.w,
            h: box.h,
            colW: rows[0].map(() => round3(box.w / rows[0].length)),
            border: [{ pt: 0.5, color: themeHex('--slide-border', 'D1D5DB') }],
            fontFace: fontFace(style),
            fontSize: fontPt(style),
            color: (cssColor(style.color) || { hex: '1A1A1A' }).hex,
            valign: 'middle'
        });
    });
}

function footerMarkup(courseTitle, index, count) {
    const footer = document.createElement('footer');
    footer.className = 'roi-slide-footer';
    footer.innerHTML = `
        <div class="footer-cell footer-course"></div>
        <div class="footer-cell footer-copyright">
            © 2026 Copyright ROI Training, Inc.<br>
            All rights reserved. Not to be reproduced without prior written consent.
        </div>
        <div class="footer-cell footer-logo">
            <img src="images/roi-logo-with-name.png" alt="ROI Training" class="roi-logo-img">
        </div>
        <div class="footer-cell footer-number"></div>
    `;
    footer.querySelector('.footer-course').textContent = courseTitle || 'ROI Training';
    footer.querySelector('.footer-number').textContent = `${index + 1} of ${count}`;
    return footer;
}

async function waitForImages(root) {
    const images = [...root.querySelectorAll('img')];
    await Promise.all(images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
        });
    }));
    await Promise.all(images.map((img) => (img.decode ? img.decode().catch(() => {}) : null)));
}

function renderCard(host, markdown, index, count, courseTitle) {
    host.innerHTML = '';
    const card = document.createElement('div');
    card.className = 'slide-card pptx-export-card';
    const topBar = document.createElement('div');
    topBar.className = 'slide-top-bar';
    const body = document.createElement('div');
    body.className = 'slide-body';
    renderSlideInto(card, body, markdown, index, { copyButtons: false });
    card.appendChild(topBar);
    card.appendChild(body);
    card.appendChild(footerMarkup(courseTitle, index, count));
    host.appendChild(card);
    return card;
}

function pptxgen() {
    const Factory = window.PptxGenJS;
    if (!Factory) throw new Error('PowerPoint export is not available in this browser.');
    return new Factory();
}

/**
 * @param {{ slides: string[], courseTitle?: string }} chapter
 * @returns {Promise<Blob>}
 */
export async function buildChapterPptx(chapter) {
    const slides = chapter && chapter.slides ? chapter.slides : [];
    const courseTitle = (chapter && chapter.courseTitle) || 'ROI Training';
    if (!slides.length) throw new Error('This chapter has no slides.');

    const host = document.createElement('div');
    host.className = 'pptx-export-host';
    host.setAttribute('aria-hidden', 'true');
    document.body.appendChild(host);

    const pres = pptxgen();
    pres.defineLayout({ name: 'ROI_16x9', width: SLIDE_W, height: SLIDE_H });
    pres.layout = 'ROI_16x9';
    pres.title = courseTitle;
    pres.author = 'ROI Training';
    pres.subject = courseTitle;

    try {
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
        for (let index = 0; index < slides.length; index += 1) {
            const card = renderCard(host, slides[index], index, slides.length, courseTitle);
            await waitForImages(card);
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const slide = pres.addSlide();
            const origin = paintBackgrounds(slide, card);
            addTables(slide, card, origin);
            await addImages(slide, card, origin);
            card.querySelectorAll('h1, h2, h3, h4, h5, h6, p, li, pre, .markdown-alert-title, .footer-course, .footer-copyright, .footer-number').forEach((el) => {
                addTextBlock(slide, el, origin);
            });
        }
        return await pres.write({ outputType: 'blob' });
    } finally {
        host.remove();
    }
}
