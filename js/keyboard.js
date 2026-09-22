/* Keyboard shortcuts and hash navigation. */
import { state, api } from './state.js';

export function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'o' || e.key === 'O')) {
            e.preventDefault();
            api.openOpenModal?.();
            return;
        }

        if (state.openModalOpen) {
            if (e.key === 'Escape') {
                e.preventDefault();
                api.closeOpenModal?.();
            }
            return;
        }

        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        switch (e.key) {
            case 'ArrowRight':
            case ' ':
            case 'Space':
            case 'PageDown':
                e.preventDefault();
                api.nextSlide?.();
                break;
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                api.prevSlide?.();
                break;
            case 'Home':
                e.preventDefault();
                api.goToSlide?.(0);
                break;
            case 'End':
                e.preventDefault();
                api.goToSlide?.(state.slides.length - 1);
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                api.toggleFullscreen?.();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                api.setAnnotationTool?.(api._currentTool === 'pen' ? 'none' : 'pen');
                break;
            case 'h':
            case 'H':
                e.preventDefault();
                api.setAnnotationTool?.(api._currentTool === 'highlighter' ? 'none' : 'highlighter');
                break;
            case 'o':
            case 'O':
                e.preventDefault();
                api.setAnnotationTool?.(api._currentTool === 'pointer' ? 'none' : 'pointer');
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                state.slideAnnotations[state.currentIndex] = [];
                api.saveAnnotationsToStorage?.();
                api.clearCanvas?.();
                api.clearSlidePointer?.();
                break;
            case 'Escape':
                break;
        }
    });

    window.addEventListener('popstate', () => {
        const hash = window.location.hash;
        if (hash) {
            const match = hash.match(/#(?:slide-)?(\d+)/i);
            if (match) {
                const index = parseInt(match[1], 10) - 1;
                if (index !== state.currentIndex) {
                    api.goToSlide?.(index);
                }
            }
        }
    });
}
