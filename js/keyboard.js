/* Keyboard shortcuts and hash navigation. */
import { state, api } from './state.js?v=2';

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
                if (api.firstSlide) api.firstSlide();
                else api.goToSlide?.(0);
                break;
            case 'End':
                e.preventDefault();
                if (api.lastSlide) api.lastSlide();
                else api.goToSlide?.(state.slides.length - 1);
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

    initPhoneSwipe();
    initPhoneFullscreen();

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

const SWIPE_MIN_PX = 40;

function initPhoneSwipe() {
    const stage = document.getElementById('presentation-stage');
    if (!stage) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    stage.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) {
            tracking = false;
            return;
        }
        const target = event.target;
        if (target && target.closest && target.closest('button, a, input, select, textarea')) {
            tracking = false;
            return;
        }
        if (state.openModalOpen) {
            tracking = false;
            return;
        }
        const chapterPicker = document.getElementById('phone-chapter-picker');
        if (chapterPicker && !chapterPicker.hidden) {
            tracking = false;
            return;
        }
        const menu = document.getElementById('side-menu');
        if (menu && menu.classList.contains('open')) {
            tracking = false;
            return;
        }
        startX = event.touches[0].clientX;
        startY = event.touches[0].clientY;
        tracking = true;
    }, { passive: true });

    stage.addEventListener('touchend', (event) => {
        if (!tracking) return;
        tracking = false;
        const touch = event.changedTouches[0];
        if (!touch) return;
        const dx = touch.clientX - startX;
        const dy = touch.clientY - startY;
        if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
        if (dx < 0) api.nextSlide?.();
        else api.prevSlide?.();
    }, { passive: true });

    stage.addEventListener('touchcancel', () => {
        tracking = false;
    }, { passive: true });
}

function initPhoneFullscreen() {
    if (!document.documentElement.classList.contains('is-phone')) return;

    const enter = () => {
        if (document.fullscreenElement || document.webkitFullscreenElement) return;
        const root = document.documentElement;
        const request = root.requestFullscreen || root.webkitRequestFullscreen;
        if (!request) return;
        Promise.resolve(request.call(root)).catch(() => {});
    };

    document.addEventListener('touchend', enter, { capture: true });
}
