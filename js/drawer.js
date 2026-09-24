/* Feature module */
import { state, els, api, SLIDE_DESIGN_WIDTH, SLIDE_DESIGN_HEIGHT, SLIDE_DESIGN_FONT_PX } from './state.js';
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
} from './layouts.js?v=45';

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
        const layoutType = extractLayoutDirective(slideMarkdown, index);
        const body = canvasEl.querySelector('.slide-body');
        if (!body) return;

        canvasEl.classList.add(`layout-${layoutType}`);
        body.innerHTML = prepareSlideHtml(slideMarkdown);

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
        if (layoutType !== 'stacked' && layoutType !== 'image-only' && layoutType !== 'full-bleed' && layoutType !== 'card-layout' && layoutType !== 'panel-left' && layoutType !== 'panel-right') {
            processSplitLayouts(body);
        }
        processExternalLinks(body);

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
                els.courseTitle.textContent = title;
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
        
            li.appendChild(a);
            els.slideList.appendChild(li);
        });

        if (drawerViewMode === 'thumbs') {
            ensureThumbObserver();
            observeThumbnails();
            scaleAllThumbnails();
        }
    }


    api.buildSlideDrawer = buildSlideDrawer;
    api.scaleAllThumbnails = scaleAllThumbnails;
}
