/* Feature module */
import { state, els, api } from './state.js?v=2';
import { renderSlideInto } from './render-slide.js?v=49';

export function initDrawer() {
    // Side Menu Drawer interactions (open / pin / close)
    const DRAWER_PIN_KEY = 'slides-viewer-drawer-pinned';
    let drawerPinned = localStorage.getItem(DRAWER_PIN_KEY) === 'true';

    function syncDrawerPinUi() {
        document.body.classList.toggle('drawer-pinned', drawerPinned);
        if (drawerPinned) {
            els.sideMenu.classList.add('open');
        }
        if (els.pinMenuBtn) {
            els.pinMenuBtn.setAttribute('aria-pressed', drawerPinned ? 'true' : 'false');
            els.pinMenuBtn.title = drawerPinned ? 'Unpin drawer' : 'Pin drawer open';
            els.pinMenuBtn.setAttribute(
                'aria-label',
                drawerPinned ? 'Unpin slide list' : 'Pin slide list open'
            );
        }
        // Stage width changes when docking — refresh fit + annotation canvas
        setTimeout(() => api.scaleSlideToFit?.(), 320);
        setTimeout(scaleAllThumbnails, 320);
    }

    function setDrawerPinned(pinned) {
        drawerPinned = !!pinned;
        localStorage.setItem(DRAWER_PIN_KEY, drawerPinned ? 'true' : 'false');
        syncDrawerPinUi();
    }

    function openDrawer() {
        els.sideMenu.classList.add('open');
        setTimeout(scaleAllThumbnails, 50);
        setTimeout(scaleAllThumbnails, 320);
    }

    function closeDrawer() {
        if (drawerPinned) {
            setDrawerPinned(false);
        }
        els.sideMenu.classList.remove('open');
    }

    els.menuToggle.addEventListener('click', () => {
        if (drawerPinned) {
            // Already docked; treat hamburger as unpin + close
            closeDrawer();
            return;
        }
        if (els.sideMenu.classList.contains('open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    els.closeMenu.addEventListener('click', closeDrawer);

    if (els.pinMenuBtn) {
        els.pinMenuBtn.addEventListener('click', () => {
            if (!drawerPinned) {
                openDrawer();
                setDrawerPinned(true);
            } else {
                setDrawerPinned(false);
            }
        });
    }

    // Restore pinned drawer on load
    if (drawerPinned) {
        syncDrawerPinUi();
    }

    // Drawer list vs thumbnail view
    const DRAWER_VIEW_KEY = 'slides-viewer-drawer-view';
    let drawerViewMode = localStorage.getItem(DRAWER_VIEW_KEY) === 'thumbs' ? 'thumbs' : 'list';
    let thumbObserver = null;

    function syncDrawerViewUi() {
        const isThumbs = drawerViewMode === 'thumbs';
        els.sideMenu.classList.toggle('view-thumbnails', isThumbs);
        if (els.drawerViewToggle) {
            els.drawerViewToggle.setAttribute('aria-pressed', isThumbs ? 'true' : 'false');
            els.drawerViewToggle.title = isThumbs ? 'Show titles' : 'Show thumbnails';
            els.drawerViewToggle.setAttribute(
                'aria-label',
                isThumbs ? 'Show slide titles' : 'Show slide thumbnails'
            );
        }
        if (isThumbs) {
            ensureThumbObserver();
            observeThumbnails();
            scaleAllThumbnails();
        }
    }

    function setDrawerViewMode(mode) {
        drawerViewMode = mode === 'thumbs' ? 'thumbs' : 'list';
        localStorage.setItem(DRAWER_VIEW_KEY, drawerViewMode);
        syncDrawerViewUi();
    }

    const THUMB_BASE_WIDTH = 960;

    function scaleThumbViewport(viewport) {
        const canvas = viewport.querySelector('.slide-thumb-canvas');
        if (!canvas) return;
        const width = viewport.clientWidth;
        if (!width) return;
        const scale = width / THUMB_BASE_WIDTH;
        canvas.style.transform = `scale(${scale})`;
    }

    function scaleAllThumbnails() {
        requestAnimationFrame(() => {
            els.slideList.querySelectorAll('.slide-thumb-viewport').forEach(scaleThumbViewport);
        });
    }

    function renderSlideThumbnail(index, canvasEl) {
        if (!canvasEl || canvasEl.dataset.rendered === 'true' || !state.slides[index]) return;

        const slideMarkdown = state.slides[index];
        const body = canvasEl.querySelector('.slide-body');
        if (!body) return;

        renderSlideInto(canvasEl, body, slideMarkdown, index, { copyButtons: false });

        const placeholder = canvasEl.parentElement && canvasEl.parentElement.querySelector('.slide-thumb-placeholder');
        if (placeholder) placeholder.remove();

        canvasEl.dataset.rendered = 'true';

        const viewport = canvasEl.closest('.slide-thumb-viewport');
        if (viewport) scaleThumbViewport(viewport);
    }

    function ensureThumbObserver() {
        if (thumbObserver || typeof IntersectionObserver === 'undefined') return;
        thumbObserver = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const viewport = entry.target;
                const index = parseInt(viewport.dataset.slideIndex, 10);
                const canvas = viewport.querySelector('.slide-thumb-canvas');
                renderSlideThumbnail(index, canvas);
                thumbObserver.unobserve(viewport);
            });
        }, {
            root: els.sideMenu,
            rootMargin: '120px 0px',
            threshold: 0.01
        });
    }

    function observeThumbnails() {
        if (!thumbObserver) return;
        els.slideList.querySelectorAll('.slide-thumb-viewport').forEach((viewport) => {
            const canvas = viewport.querySelector('.slide-thumb-canvas');
            if (canvas && canvas.dataset.rendered === 'true') return;
            thumbObserver.observe(viewport);
        });
    }

    if (els.drawerViewToggle) {
        els.drawerViewToggle.addEventListener('click', () => {
            setDrawerViewMode(drawerViewMode === 'thumbs' ? 'list' : 'thumbs');
        });
    }

    if (els.showAllSlidesBtn) {
        els.showAllSlidesBtn.addEventListener('click', () => {
            if (!state.hiddenSlides || state.hiddenSlides.size === 0) return;
            state.hiddenSlides.clear();
            api.saveHiddenSlidesToStorage?.();
            syncHiddenSlidesUi();
            api.syncSlidePresentationState?.();
        });
    }

    function syncHiddenSlidesUi() {
        const items = els.slideList ? els.slideList.querySelectorAll(':scope > li') : [];
        const total = state.slides.length;
        const hiddenCount = state.hiddenSlides ? state.hiddenSlides.size : 0;
        const onlyOneVisibleLeft = total - hiddenCount <= 1;

        items.forEach((li, index) => {
            const isHidden = state.hiddenSlides && state.hiddenSlides.has(index);
            li.classList.toggle('is-hidden', !!isHidden);
            const btn = li.querySelector(':scope > .slide-hide-btn');
            if (btn) {
                btn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');
                const disableHide = !isHidden && onlyOneVisibleLeft;
                btn.disabled = disableHide;
                const actionLabel = isHidden
                    ? 'Click to show slide'
                    : disableHide
                        ? 'At least one slide must remain visible'
                        : 'Click to hide slide';
                btn.title = actionLabel;
                btn.setAttribute('aria-label', `${actionLabel} (Slide ${index + 1})`);
            }
        });

        if (els.showAllSlidesBtn) {
            if (hiddenCount > 0) {
                els.showAllSlidesBtn.hidden = false;
                els.showAllSlidesBtn.textContent = `Show all (${hiddenCount})`;
                els.showAllSlidesBtn.title = `Unhide ${hiddenCount} hidden slide${hiddenCount === 1 ? '' : 's'}`;
            } else {
                els.showAllSlidesBtn.hidden = true;
            }
        }
    }

    function toggleSlideHidden(index) {
        if (!state.hiddenSlides) state.hiddenSlides = new Set();
        if (state.hiddenSlides.has(index)) {
            state.hiddenSlides.delete(index);
        } else {
            // Keep at least one slide visible
            if (state.slides.length - state.hiddenSlides.size <= 1) return;
            state.hiddenSlides.add(index);
        }
        api.saveHiddenSlidesToStorage?.();
        syncHiddenSlidesUi();
        api.syncSlidePresentationState?.();
    }

    if (typeof ResizeObserver !== 'undefined') {
        const thumbScaleObserver = new ResizeObserver(() => {
            if (drawerViewMode === 'thumbs') scaleAllThumbnails();
        });
        thumbScaleObserver.observe(els.sideMenu);
    }

    syncDrawerViewUi();

    // Slide Drawer Generator
    function buildSlideDrawer(customCourseTitle) {
        if (thumbObserver) {
            thumbObserver.disconnect();
        }
        els.slideList.innerHTML = '';
        state.slides.forEach((slideMarkdown, index) => {
            // Extract the first heading line if available
            const lines = slideMarkdown.split('\n');
            let title = `Slide ${index + 1}`;
        
            for (let line of lines) {
                const cleanLine = line.trim();
                if (cleanLine.startsWith('#')) {
                    title = cleanLine.replace(/^#+\s*/, '');
                    break;
                }
            }
        
            // If no explicit course-title comment was provided, fallback to Slide 1 heading
            if (!customCourseTitle && index === 0 && title !== `Slide 1`) {
                if (els.courseTitle) els.courseTitle.textContent = title;
                if (els.footerCourseTitle) {
                    els.footerCourseTitle.textContent = title;
                    requestAnimationFrame(() => api.fitFooterCourseTitle?.());
                }
            }
        
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#slide-${index + 1}`;
            a.className = 'slide-nav-link';

            const thumb = document.createElement('div');
            thumb.className = 'slide-thumb';
            thumb.setAttribute('aria-hidden', 'true');

            const viewport = document.createElement('div');
            viewport.className = 'slide-thumb-viewport';
            viewport.dataset.slideIndex = String(index);

            const placeholder = document.createElement('div');
            placeholder.className = 'slide-thumb-placeholder';
            placeholder.textContent = 'Preview';

            const canvas = document.createElement('div');
            canvas.className = 'slide-thumb-canvas slide-card';
            canvas.innerHTML = '<div class="slide-top-bar"></div><div class="slide-body"></div>';

            viewport.appendChild(placeholder);
            viewport.appendChild(canvas);
            thumb.appendChild(viewport);

            const label = document.createElement('span');
            label.className = 'slide-nav-label';
            label.innerHTML = `<strong>${index + 1}.</strong> ${title}`;

            a.appendChild(thumb);
            a.appendChild(label);
        
            a.addEventListener('click', (e) => {
                e.preventDefault();
                api.goToSlide(index);
                if (!drawerPinned) {
                    els.sideMenu.classList.remove('open');
                }
            });

            const hideBtn = document.createElement('button');
            hideBtn.type = 'button';
            hideBtn.className = 'slide-hide-btn';
            hideBtn.innerHTML =
                '<svg class="icon-eye" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
                    '<circle cx="12" cy="12" r="3"/>' +
                '</svg>' +
                '<svg class="icon-eye-off" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>' +
                    '<line x1="1" y1="1" x2="23" y2="23"/>' +
                '</svg>';
            hideBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleSlideHidden(index);
            });
        
            li.appendChild(a);
            li.appendChild(hideBtn);
            els.slideList.appendChild(li);
        });

        syncHiddenSlidesUi();

        if (drawerViewMode === 'thumbs') {
            ensureThumbObserver();
            observeThumbnails();
            scaleAllThumbnails();
        }
    }


    function invalidateThumbnails() {
        els.slideList.querySelectorAll('.slide-thumb-canvas').forEach((canvas) => {
            delete canvas.dataset.rendered;
        });
        if (drawerViewMode !== 'thumbs') return;
        ensureThumbObserver();
        observeThumbnails();
    }

    api.buildSlideDrawer = buildSlideDrawer;
    api.scaleAllThumbnails = scaleAllThumbnails;
    api.invalidateThumbnails = invalidateThumbnails;
    api.syncHiddenSlidesUi = syncHiddenSlidesUi;
}
