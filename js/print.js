/* Feature module */
import { state, els } from './state.js?v=2';
import { renderSlideInto } from './render-slide.js?v=49';

/**
 * Shrink a print slide body so its full content fits in the 16:9 viewport.
 *
 * Scaling the scroll container itself only shrinks the already-clipped viewport
 * (empty space below, content still cut off). When overflow is detected, wrap
 * children in an inner div and scale that wrapper instead.
 */
function fitPrintSlideBody(body, { minScale = 0.5 } = {}) {
    if (!body || body.clientHeight < 2) return;
    if (body.scrollHeight <= body.clientHeight + 1) return;

    let inner = body.querySelector(':scope > .print-fit-inner');
    if (!inner) {
        inner = document.createElement('div');
        inner.className = 'print-fit-inner';
        while (body.firstChild) {
            inner.appendChild(body.firstChild);
        }
        body.appendChild(inner);
    }

    // Body becomes a fixed clip frame; inner holds the full unclipped content.
    body.style.overflow = 'hidden';
    inner.style.transformOrigin = '';
    inner.style.transform = '';
    inner.style.width = '';

    const available = body.clientHeight;

    const applyScale = (s) => {
        if (s >= 0.999) {
            inner.style.transformOrigin = '';
            inner.style.transform = '';
            inner.style.width = '';
            return;
        }
        inner.style.transformOrigin = 'top left';
        inner.style.transform = `scale(${s})`;
        // Wider layout before scale so reflowed lines still span the card.
        inner.style.width = `${100 / s}%`;
    };

    let low = minScale;
    let high = 1;
    for (let i = 0; i < 14; i++) {
        const mid = (low + high) / 2;
        applyScale(mid);
        // Layout height is unscaled; visual height is roughly scrollHeight * mid.
        if (inner.scrollHeight * mid <= available + 1) {
            low = mid;
        } else {
            high = mid;
        }
    }
    applyScale(low);
}

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
            const card = document.createElement('div');
            card.className = 'slide-card print-slide-card';

            const topBar = document.createElement('div');
            topBar.className = 'slide-top-bar';

            const body = document.createElement('div');
            body.className = 'slide-body';
            const layoutType = renderSlideInto(card, body, slideMarkdown, index);

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

        // Shrink overflowing bodies so each slide fits one 16:9 PDF page.
        els.printStage.querySelectorAll('.print-slide-card .slide-body').forEach((body) => {
            fitPrintSlideBody(body);
        });

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
