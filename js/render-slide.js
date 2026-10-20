/* Shared slide renderer for the viewer stage, thumbnails, print, and the editor preview. */
import {
    extractLayoutDirective,
    prepareSlideHtml,
    processNavigationLayout,
    processThreeColumnLayout,
    processTwoColumnLayout,
    processCardLayout,
    processPanelLayout,
    processStackedLayout,
    processGitHubAlerts,
    processRelativeImages,
    processSplitLayouts,
    processCodeCopyButtons,
    processExternalLinks
} from './layouts.js?v=47';

const WHITE_ROI_LOGO = new URL('../images/roi-logo-with-name-white.png', import.meta.url).href;
const ROI_WORDMARK_RE = /(?:^|\/)roi-logo-with-name(?:-white)?\.(?:png|svg|webp|jpe?g)(?:\?.*)?$/i;
/* Title covers in these themes are dark. Light title slides keep the color wordmark. */
const DARK_TITLE_THEMES = new Set(['roi-alt-theme', 'demo-theme', 'demo-2-theme']);

const LAYOUT_CLASSES = [
    'layout-title',
    'layout-navigation',
    'layout-section',
    'layout-split',
    'layout-content',
    'layout-three-column',
    'layout-title-image',
    'layout-image-only',
    'layout-full-bleed',
    'layout-two-column',
    'layout-stacked',
    'layout-card-layout',
    'layout-panel-left',
    'layout-panel-right'
];

/**
 * Fill a slide card from Markdown. Image URLs resolve through state.courseBaseUrl
 * and state.localAssetMap (see processRelativeImages).
 * @param {HTMLElement} card
 * @param {HTMLElement} body
 * @param {string} markdown
 * @param {number} index
 * @param {{ copyButtons?: boolean }} [options]
 */
export function renderSlideInto(card, body, markdown, index, options = {}) {
    const copyButtons = options.copyButtons !== false;
    const layoutType = extractLayoutDirective(markdown, index);

    const whiteWordmark = layoutType === 'title' && DARK_TITLE_THEMES.has(
        document.documentElement.getAttribute('data-theme') || ''
    );

    if (card) {
        card.classList.remove(...LAYOUT_CLASSES, 'logo-on-dark');
        card.classList.add(`layout-${layoutType}`);
        if (whiteWordmark) card.classList.add('logo-on-dark');
    }

    body.innerHTML = prepareSlideHtml(markdown);

    if (layoutType === 'navigation' || layoutType === 'section') {
        processNavigationLayout(body);
    } else if (layoutType === 'three-column') {
        processThreeColumnLayout(body);
    } else if (layoutType === 'two-column') {
        processTwoColumnLayout(body);
    } else if (layoutType === 'card-layout') {
        processCardLayout(body);
    } else if (layoutType === 'panel-left' || layoutType === 'panel-right') {
        processPanelLayout(body, layoutType === 'panel-left' ? 'left' : 'right');
    } else if (layoutType === 'stacked') {
        processStackedLayout(body);
    }

    processGitHubAlerts(body);
    markRoiWordmarks(body);
    processRelativeImages(body);
    if (whiteWordmark) useWhiteRoiWordmark(body);

    if (
        layoutType !== 'stacked' &&
        layoutType !== 'image-only' &&
        layoutType !== 'full-bleed' &&
        layoutType !== 'card-layout' &&
        layoutType !== 'panel-left' &&
        layoutType !== 'panel-right'
    ) {
        processSplitLayouts(body);
    }

    if (copyButtons) {
        processCodeCopyButtons(body);
    }
    processExternalLinks(body);

    return layoutType;
}

function markRoiWordmarks(container) {
    container.querySelectorAll('img').forEach((img) => {
        const src = img.getAttribute('src') || '';
        if (ROI_WORDMARK_RE.test(decodeURIComponent(src))) {
            img.dataset.roiWordmark = 'true';
        }
    });
}

/** Dark title covers swap the color wordmark for the white asset. */
function useWhiteRoiWordmark(container) {
    container.querySelectorAll('img[data-roi-wordmark]').forEach((img) => {
        img.src = WHITE_ROI_LOGO;
        img.classList.add('roi-logo-on-dark');
    });
}
