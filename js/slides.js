/* Render the current slide onto the stage. */
import { state, els, api } from './state.js';
import { renderSlideInto } from './render-slide.js?v=46';

export function initSlides() {
    function goToSlide(index) {
        if (state.slides.length === 0) return;
    
        // Clamp index bounds
        state.currentIndex = Math.max(0, Math.min(index, state.slides.length - 1));
        renderSlide(state.currentIndex);
    }

    function prevSlide() {
        if (state.currentIndex > 0) {
            goToSlide(state.currentIndex - 1);
        }
    }

    function nextSlide() {
        if (state.currentIndex < state.slides.length - 1) {
            goToSlide(state.currentIndex + 1);
        }
    }

    // Render Slide Content
    function renderSlide(index) {
        const slideMarkdown = state.slides[index];

        // Re-trigger fade animation
        els.slideCard.classList.remove('slide-card');
        void els.slideCard.offsetWidth; // Trigger reflow
        els.slideCard.classList.add('slide-card');

        renderSlideInto(els.slideCard, els.slideBody, slideMarkdown, index);

        // Apply current font scaling
        api.updateFontSize?.();
    
        // Update ROI Slide Footer Counter (e.g. 1 of 12)
        els.footerSlideNumber.textContent = `${index + 1} of ${state.slides.length}`;
    
        // Update Progress Bar
        const progressPercent = ((index + 1) / state.slides.length) * 100;
        els.progressBar.style.width = `${progressPercent}%`;
    
        setTimeout(() => api.redrawCurrentSlideAnnotations?.(), 50);
        api.clearSlidePointer?.();
    
        // Update Active Item in Side Drawer
        const drawerLinks = els.slideList.querySelectorAll('a');
        drawerLinks.forEach((link, idx) => {
            if (idx === index) {
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
            `${window.location.pathname}${window.location.search}#slide-${index + 1}`
        );
    }

    api.goToSlide = goToSlide;
    api.prevSlide = prevSlide;
    api.nextSlide = nextSlide;
    api.renderSlide = renderSlide;
}
