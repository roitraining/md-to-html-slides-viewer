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
} from './layouts.js?v=46';

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

    if (card) {
        card.classList.remove(...LAYOUT_CLASSES);
        card.classList.add(`layout-${layoutType}`);
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
    processRelativeImages(body);

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
