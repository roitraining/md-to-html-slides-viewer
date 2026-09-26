/* Expand a slide image to fill the canvas, then restore it. Live stage only. */
import { els, api } from './state.js';

const EXPAND_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/></svg>`;

const RESTORE_ICON = `<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4"/><path d="M15 4v5h5"/><path d="M9 20v-5H4"/><path d="M15 20v-5h5"/></svg>`;

const BUTTON_PX = 28;
const BUTTON_INSET = 8;

export function initImageZoom() {
    const layer = document.createElement('div');
    layer.id = 'image-zoom-layer';
    layer.className = 'image-zoom-layer';
    els.slideCard.appendChild(layer);

    // Buttons live outside the scaled slide so they stay above the annotation dock.
    const controls = document.createElement('div');
    controls.className = 'image-zoom-controls';
    document.body.appendChild(controls);

    const restore = document.createElement('button');
    restore.type = 'button';
    restore.className = 'image-zoom-btn image-zoom-restore';
    restore.hidden = true;
    restore.setAttribute('aria-label', 'Restore image');
    restore.title = 'Restore image';
    restore.innerHTML = RESTORE_ICON;
    restore.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        collapse();
        layoutImageZoom();
    });
    controls.appendChild(restore);

    /** @type {{ btn: HTMLButtonElement, img: HTMLImageElement }[]} */
    let buttons = [];
    /** @type {HTMLElement | null} */
    let overlay = null;
    let generation = 0;
    let layoutFrame = 0;

    function placeAtTopRight(btn, rect) {
        let x = rect.right - BUTTON_INSET - BUTTON_PX;
        let y = rect.top + BUTTON_INSET;
        if (x < rect.left) x = rect.left;
        if (y + BUTTON_PX > rect.bottom) y = Math.max(rect.top, rect.bottom - BUTTON_PX);
        btn.hidden = false;
        btn.style.left = `${x}px`;
        btn.style.top = `${y}px`;
    }

    function collapse() {
        restore.hidden = true;
        if (!overlay) return;
        overlay.remove();
        overlay = null;
    }

    function fitOverlay() {
        if (!overlay) return;
        const frame = overlay.querySelector('.image-expand-frame');
        const img = overlay.querySelector('img');
        if (!frame || !img) return;
        const maxW = overlay.clientWidth;
        const maxH = overlay.clientHeight;
        const nw = img.naturalWidth;
        const nh = img.naturalHeight;
        if (!maxW || !maxH || !nw || !nh) return;

        let width = maxW;
        let height = width * (nh / nw);
        if (height > maxH) {
            height = maxH;
            width = height * (nw / nh);
        }
        frame.style.width = `${width}px`;
        frame.style.height = `${height}px`;
    }

    function expand(img) {
        const src = img.currentSrc || img.src;
        if (!src) return;

        collapse();

        overlay = document.createElement('div');
        overlay.className = 'image-expand-overlay';

        const frame = document.createElement('div');
        frame.className = 'image-expand-frame';

        const zoomed = document.createElement('img');
        zoomed.alt = img.alt || '';
        zoomed.draggable = false;
        zoomed.src = src;

        frame.appendChild(zoomed);
        overlay.appendChild(frame);
        layer.appendChild(overlay);

        const gen = generation;
        const onReady = () => {
            if (gen !== generation || !overlay) return;
            fitOverlay();
            layoutImageZoom();
        };
        if (zoomed.complete && zoomed.naturalWidth) onReady();
        else zoomed.addEventListener('load', onReady, { once: true });
    }

    function clearButtons() {
        buttons.forEach(({ btn }) => btn.remove());
        buttons = [];
    }

    function layoutNow() {
        if (overlay) {
            fitOverlay();
            buttons.forEach(({ btn }) => {
                btn.hidden = true;
            });
            const frame = overlay.querySelector('.image-expand-frame');
            const frameRect = frame && frame.getBoundingClientRect();
            if (!frameRect || frameRect.width < 12 || frameRect.height < 12) {
                restore.hidden = true;
                return;
            }
            placeAtTopRight(restore, frameRect);
            return;
        }

        restore.hidden = true;
        const body = els.slideBody;
        if (!body) return;
        const bodyRect = body.getBoundingClientRect();

        buttons.forEach(({ btn, img }) => {
            if (!img.isConnected) {
                btn.hidden = true;
                return;
            }
            const imgRect = img.getBoundingClientRect();
            const overlapLeft = Math.max(imgRect.left, bodyRect.left);
            const overlapTop = Math.max(imgRect.top, bodyRect.top);
            const overlapRight = Math.min(imgRect.right, bodyRect.right);
            const overlapBottom = Math.min(imgRect.bottom, bodyRect.bottom);
            if (overlapRight - overlapLeft < 12 || overlapBottom - overlapTop < 12) {
                btn.hidden = true;
                return;
            }
            placeAtTopRight(btn, {
                left: overlapLeft,
                top: overlapTop,
                right: overlapRight,
                bottom: overlapBottom
            });
        });
    }

    function layoutImageZoom() {
        cancelAnimationFrame(layoutFrame);
        layoutNow();
        layoutFrame = requestAnimationFrame(layoutNow);
    }

    function syncImageZoom() {
        const gen = ++generation;
        collapse();
        clearButtons();

        const images = els.slideBody.querySelectorAll('img');
        images.forEach((img) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'image-zoom-btn';
            btn.hidden = true;
            const label = img.alt ? `Expand image: ${img.alt}` : 'Expand image';
            btn.setAttribute('aria-label', label);
            btn.title = 'Expand image';
            btn.innerHTML = EXPAND_ICON;
            btn.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                expand(img);
            });
            controls.appendChild(btn);
            buttons.push({ btn, img });

            const onReady = () => {
                if (gen !== generation) return;
                layoutImageZoom();
            };
            if (img.complete && img.naturalWidth) onReady();
            else img.addEventListener('load', onReady, { once: true });
        });

        layoutImageZoom();
    }

    els.slideCard.addEventListener('scroll', () => layoutImageZoom(), true);

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || !overlay) return;
        if (document.fullscreenElement) return;
        event.preventDefault();
        event.stopPropagation();
        collapse();
        layoutImageZoom();
    }, true);

    api.syncImageZoom = syncImageZoom;
    api.layoutImageZoom = layoutImageZoom;
    api.collapseExpandedImage = () => {
        collapse();
        layoutImageZoom();
    };
}
