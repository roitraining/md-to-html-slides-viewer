/* Feature module */
import { state, els, api, SLIDE_DESIGN_WIDTH, SLIDE_DESIGN_HEIGHT, SLIDE_DESIGN_FONT_PX } from './state.js';
import {
    extractLayoutDirective,
    prepareSlideHtml,
    processNavigationLayout,
    processThreeColumnLayout,
    processTwoColumnLayout,
    processCardLayout,
    processStackedLayout,
    processGitHubAlerts,
    processRelativeImages,
    processSplitLayouts,
    processCodeCopyButtons,
    processExternalLinks
} from './layouts.js';

export function initPrint() {
    // PDF Export Functionality (Native Print PDF)
    if (els.exportPdfBtn) {
        els.exportPdfBtn.addEventListener('click', prepareAndPrintPdf);
    }

    async function prepareAndPrintPdf() {
        if (!els.printStage || state.slides.length === 0) return;

        if (els.exportPdfBtn) els.exportPdfBtn.textContent = '⏳';

        // Clear previous print content
        els.printStage.innerHTML = '';

        // Render each slide sequentially into els.printStage
        state.slides.forEach((slideMarkdown, index) => {
            const layoutType = extractLayoutDirective(slideMarkdown, index);
            const html = prepareSlideHtml(slideMarkdown);

            const card = document.createElement('div');
            card.className = `slide-card print-slide-card layout-${layoutType}`;

            const topBar = document.createElement('div');
            topBar.className = 'slide-top-bar';

            const body = document.createElement('div');
            body.className = 'slide-body';
            body.innerHTML = html;

            // Apply post-processing
            processGitHubAlerts(body);
            processRelativeImages(body);
            if (layoutType === 'stacked') {
                processStackedLayout(body);
            } else if (layoutType !== 'image-only' && layoutType !== 'full-bleed' && layoutType !== 'card-layout') {
                processSplitLayouts(body);
            }
            processCodeCopyButtons(body);
            processExternalLinks(body);

            if (layoutType === 'navigation' || layoutType === 'section') {
                processNavigationLayout(body);
            } else if (layoutType === 'three-column') {
                processThreeColumnLayout(body);
            } else if (layoutType === 'two-column') {
                processTwoColumnLayout(body);
            } else if (layoutType === 'card-layout') {
                processCardLayout(body);
            }

            // Convert all img src in body to absolute URLs so browser print engine loads them 100% reliably
            const bodyImgs = body.querySelectorAll('img');
            bodyImgs.forEach(img => {
                const src = img.getAttribute('src');
                if (src) {
                    try {
                        img.src = new URL(src, window.location.href).href;
                    } catch (e) {
                        // Keep current src if resolution fails
                    }
                }
                img.loading = 'eager';
                img.decoding = 'sync';
                if (layoutType !== 'full-bleed') {
                    img.style.width = 'auto';
                    img.style.height = 'auto';
                    img.style.maxWidth = '100%';
                    img.style.objectFit = 'contain';
                }
            });

            // Create slide footer
            const footer = document.createElement('footer');
            footer.className = 'roi-slide-footer';
        
            const currentTitle = (els.footerCourseTitle && els.footerCourseTitle.textContent) ? els.footerCourseTitle.textContent : 'ROI Training';
        
            footer.innerHTML = `
                <div class="footer-cell footer-course"></div>
                <div class="footer-cell footer-copyright">
                    © 2026 Copyright ROI Training, Inc.<br>
                    All rights reserved. Not to be reproduced without prior written consent.
                </div>
                <div class="footer-cell footer-logo">
                    <img src="images/roi-logo.png" alt="ROI Training" class="roi-logo-img">
                    ROI Training, Inc.
                </div>
                <div class="footer-cell footer-number">${index + 1} of ${state.slides.length}</div>
            `;
            const printCourseEl = footer.querySelector('.footer-course');
            if (printCourseEl) {
                printCourseEl.textContent = currentTitle;
                // Mirror live footer fit size (print-stage is display:none until print)
                if (els.footerCourseTitle && els.footerCourseTitle.style.fontSize) {
                    printCourseEl.style.fontSize = els.footerCourseTitle.style.fontSize;
                }
            }

            card.appendChild(topBar);
            card.appendChild(body);
            card.appendChild(footer);
            els.printStage.appendChild(card);
        });

        // Load images off-screen (do not use visibility:hidden — that prints blank)
        els.printStage.classList.add('is-preparing');
        els.printStage.removeAttribute('style');

        // Wait for all images in els.printStage to complete loading before invoking window.print()
        const images = Array.from(els.printStage.querySelectorAll('img'));
        const imagePromises = images.map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });

        await Promise.all(imagePromises);
        await new Promise(resolve => setTimeout(resolve, 200));

        if (els.exportPdfBtn) els.exportPdfBtn.textContent = '🖨️';

        // Leave preparing class on so content stays in DOM; @media print overrides it to on-page
        window.print();
    }

    window.addEventListener('afterprint', () => {
        if (els.printStage) {
            els.printStage.innerHTML = '';
            els.printStage.classList.remove('is-preparing');
            els.printStage.removeAttribute('style');
        }
    });


}
