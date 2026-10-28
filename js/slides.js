/* Render the current slide onto the stage. */
import { state, els, api } from './state.js?v=2';
import { renderSlideInto } from './render-slide.js?v=49';

export function initSlides() {
    function isFullscreenMode() {
        return !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.body.classList.contains('is-fullscreen')
        );
    }

    function getVisibleSlideIndices() {
        const indices = [];
        const hidden = state.hiddenSlides;
        for (let i = 0; i < state.slides.length; i++) {
            if (!hidden || !hidden.has(i)) {
                indices.push(i);
            }
        }
        // Fallback if somehow all were marked hidden
        if (indices.length === 0 && state.slides.length > 0) {
            indices.push(0);
        }
        return indices;
    }

    function findNearestVisibleSlide(fromIndex) {
        const visible = getVisibleSlideIndices();
        if (!visible.length) return 0;
        if (visible.includes(fromIndex)) return fromIndex;
        const next = visible.find((idx) => idx > fromIndex);
        if (next !== undefined) return next;
        return visible[visible.length - 1];
    }

    function goToSlide(index, { allowHiddenInWindowed = true } = {}) {
        if (state.slides.length === 0) return;

        let target = Math.max(0, Math.min(index, state.slides.length - 1));
        if (
            (isFullscreenMode() || !allowHiddenInWindowed) &&
            state.hiddenSlides &&
            state.hiddenSlides.has(target)
        ) {
            target = findNearestVisibleSlide(target);
        }

        state.currentIndex = target;
        renderSlide(state.currentIndex);
    }

    function prevSlide() {
        if (state.slides.length === 0) return;
        const visible = getVisibleSlideIndices();
        let prev = -1;
        for (let i = visible.length - 1; i >= 0; i--) {
            if (visible[i] < state.currentIndex) {
                prev = visible[i];
                break;
            }
        }
        if (prev !== -1) goToSlide(prev);
    }

    function nextSlide() {
        if (state.slides.length === 0) return;
        const visible = getVisibleSlideIndices();
        const next = visible.find((idx) => idx > state.currentIndex);
        if (next !== undefined) goToSlide(next);
    }

    function firstSlide() {
        if (state.slides.length === 0) return;
        const visible = getVisibleSlideIndices();
        if (visible.length) goToSlide(visible[0]);
    }

    function lastSlide() {
        if (state.slides.length === 0) return;
        const visible = getVisibleSlideIndices();
        if (visible.length) goToSlide(visible[visible.length - 1]);
    }

    function syncSlidePresentationState() {
        if (!state.slides.length) {
            syncSlideNav();
            return;
        }

        if (isFullscreenMode() && state.hiddenSlides && state.hiddenSlides.has(state.currentIndex)) {
            const target = findNearestVisibleSlide(state.currentIndex);
            if (target !== state.currentIndex) {
                goToSlide(target);
                return;
            }
        }

        const safeIndex = Math.max(0, Math.min(state.currentIndex, state.slides.length - 1));
        const visible = getVisibleSlideIndices();
        const displayTotal = visible.length;
        const posIndex = visible.indexOf(safeIndex);

        if (posIndex !== -1) {
            const displayPos = posIndex + 1;
            els.footerSlideNumber.textContent = `${displayPos} of ${displayTotal}`;
            const progressPercent = (displayPos / displayTotal) * 100;
            els.progressBar.style.width = `${progressPercent}%`;
        } else {
            // Viewing a hidden slide in windowed mode (selected from drawer)
            const priorVisible = visible.filter((idx) => idx < safeIndex).length;
            els.footerSlideNumber.textContent = `Hidden (${displayTotal} shown)`;
            const progressPercent = (Math.max(1, priorVisible) / displayTotal) * 100;
            els.progressBar.style.width = `${progressPercent}%`;
        }

        syncSlideNav();
    }

    // Render Slide Content. Clamp so a leftover index from a longer chapter
    // cannot throw while the new chapter is still settling on slide 1.
    function renderSlide(index) {
        if (!state.slides.length) return;
        const safeIndex = Math.max(0, Math.min(index, state.slides.length - 1));
        const slideMarkdown = state.slides[safeIndex];
        if (typeof slideMarkdown !== 'string') return;
        state.currentIndex = safeIndex;

        // Re-trigger fade animation
        els.slideCard.classList.remove('slide-card');
        void els.slideCard.offsetWidth; // Trigger reflow
        els.slideCard.classList.add('slide-card');

        renderSlideInto(els.slideCard, els.slideBody, slideMarkdown, safeIndex);

        // Apply current font scaling
        api.updateFontSize?.();
        api.syncImageZoom?.();
    
        setTimeout(() => api.redrawCurrentSlideAnnotations?.(), 50);
        api.clearSlidePointer?.();
    
        // Update Active Item in Side Drawer
        const drawerLinks = els.slideList.querySelectorAll(':scope > li > a.slide-nav-link');
        drawerLinks.forEach((link, idx) => {
            if (idx === safeIndex) {
                link.classList.add('active');
                // Keep the active slide visible when the drawer is docked
                if (document.body.classList.contains('drawer-pinned') || els.sideMenu.classList.contains('open')) {
                    link.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                }
            } else {
                link.classList.remove('active');
            }
        });

        // Sync URL Hash without jumping window scroll (preserve ?course=)
        history.replaceState(
            null,
            '',
            `${window.location.pathname}${window.location.search}#slide-${safeIndex + 1}`
        );

        syncSlidePresentationState();
    }

    function syncSlideNav() {
        const count = state.slides.length;
        const index = state.currentIndex;
        if (count === 0) {
            if (els.prevSlideBtn) els.prevSlideBtn.disabled = true;
            if (els.nextSlideBtn) els.nextSlideBtn.disabled = true;
            return;
        }
        const visible = getVisibleSlideIndices();
        const firstVisible = visible[0] ?? 0;
        const lastVisible = visible[visible.length - 1] ?? count - 1;
        if (els.prevSlideBtn) els.prevSlideBtn.disabled = index <= firstVisible;
        if (els.nextSlideBtn) els.nextSlideBtn.disabled = index >= lastVisible;
    }

    els.prevSlideBtn = document.getElementById('prev-slide-btn');
    els.nextSlideBtn = document.getElementById('next-slide-btn');
    els.prevSlideBtn?.addEventListener('click', prevSlide);
    els.nextSlideBtn?.addEventListener('click', nextSlide);
    syncSlideNav();

    api.goToSlide = goToSlide;
    api.prevSlide = prevSlide;
    api.nextSlide = nextSlide;
    api.firstSlide = firstSlide;
    api.lastSlide = lastSlide;
    api.renderSlide = renderSlide;
    api.syncSlidePresentationState = syncSlidePresentationState;
}
