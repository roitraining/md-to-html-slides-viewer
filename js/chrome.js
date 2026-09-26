/* Feature module */
import { state, els, api, SLIDE_DESIGN_WIDTH, SLIDE_DESIGN_HEIGHT, SLIDE_DESIGN_FONT_PX } from './state.js';
import { loadSlideThemes, resolveThemeName } from './themes.js';

export function initChrome() {
    const SLIDE_THEME_KEY = 'slides-viewer-slide-theme';
    let availableThemes = ['roi-theme'];

    function applySlideTheme(name, { persist = true } = {}) {
        const theme = resolveThemeName(name, availableThemes);
        document.documentElement.setAttribute('data-theme', theme);
        if (els.slideThemeSelect && els.slideThemeSelect.querySelector(`option[value="${theme}"]`)) {
            els.slideThemeSelect.value = theme;
        }
        if (persist) localStorage.setItem(SLIDE_THEME_KEY, theme);
    }

    const themeParam = new URLSearchParams(window.location.search).get('theme');
    const savedSlideTheme = localStorage.getItem(SLIDE_THEME_KEY);
    loadSlideThemes(els.slideThemeSelect).then((ids) => {
        if (ids.length) availableThemes = ids;
        applySlideTheme(themeParam || savedSlideTheme || document.documentElement.getAttribute('data-theme'), { persist: false });
    }).catch((err) => {
        console.error(err);
        applySlideTheme(themeParam || savedSlideTheme || document.documentElement.getAttribute('data-theme'), { persist: false });
    });

    function focusSlideStage() {
        if (!els.presentationStage) return;
        els.presentationStage.focus({ preventScroll: true });
    }

    if (els.slideThemeSelect) {
        els.slideThemeSelect.addEventListener('change', () => {
            applySlideTheme(els.slideThemeSelect.value);
            api.fitFooterCourseTitle?.();
            focusSlideStage();
        });
    }

    // Light / dark player mode
    const savedTheme = localStorage.getItem('slides-viewer-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        els.themeToggle.textContent = '☀️';
    }

    els.themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        els.themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('slides-viewer-theme', isDark ? 'dark' : 'light');
    });

    // Font Scaling: 50%–200% in 25% steps (starts at 100%)
    const FONT_SIZE_MIN = 50;
    const FONT_SIZE_MAX = 200;
    const FONT_SIZE_STEP = 25;

    function snapFontSize(value) {
        const n = parseInt(value, 10);
        if (Number.isNaN(n)) return 100;
        const snapped = Math.round(n / FONT_SIZE_STEP) * FONT_SIZE_STEP;
        return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, snapped));
    }

    function syncFontControls() {
        const size = state.currentFontSize;
        const atMin = size <= FONT_SIZE_MIN;
        const atMax = size >= FONT_SIZE_MAX;
        if (els.fontSizeDecrease) {
            els.fontSizeDecrease.disabled = atMin;
            els.fontSizeDecrease.title = atMin
                ? `Text size ${size}% (minimum)`
                : `Decrease text size (currently ${size}%)`;
        }
        if (els.fontSizeIncrease) {
            els.fontSizeIncrease.disabled = atMax;
            els.fontSizeIncrease.title = atMax
                ? `Text size ${size}% (maximum)`
                : `Increase text size (currently ${size}%)`;
        }
    }

    function updateFontSize() {
        state.currentFontSize = snapFontSize(state.currentFontSize);
        // Size relative to the design canvas root — uniform stage scale handles monitor size
        if (els.slideCard) {
            els.slideCard.style.fontSize = `${(SLIDE_DESIGN_FONT_PX * state.currentFontSize) / 100}px`;
        }
        localStorage.setItem('slides-viewer-font-size', state.currentFontSize);
        syncFontControls();
        fitFooterCourseTitle();
        api.layoutImageZoom?.();
    }

    function stepFontSize(delta) {
        state.currentFontSize = snapFontSize(state.currentFontSize + delta);
        updateFontSize();
        focusSlideStage();
    }

    const savedFontSize = localStorage.getItem('slides-viewer-font-size');
    if (savedFontSize) {
        state.currentFontSize = snapFontSize(savedFontSize);
    }
    updateFontSize();

    if (els.fontSizeDecrease) {
        els.fontSizeDecrease.addEventListener('click', () => stepFontSize(-FONT_SIZE_STEP));
    }
    if (els.fontSizeIncrease) {
        els.fontSizeIncrease.addEventListener('click', () => stepFontSize(FONT_SIZE_STEP));
    }

    /**
     * Shrink (or restore) footer course title font so the full string fits
     * in the allotted footer cell — long titles scale down, short ones use the CSS max.
     */
    function fitTextToWidth(el, { minPx = 9 } = {}) {
        if (!el || !el.clientWidth) return;

        el.style.fontSize = '';
        const maxPx = parseFloat(getComputedStyle(el).fontSize);
        if (!maxPx || Number.isNaN(maxPx)) return;

        el.style.fontSize = `${maxPx}px`;
        if (el.scrollWidth <= el.clientWidth) {
            el.style.fontSize = '';
            return;
        }

        let low = minPx;
        let high = maxPx;
        for (let i = 0; i < 14; i++) {
            const mid = (low + high) / 2;
            el.style.fontSize = `${mid}px`;
            if (el.scrollWidth > el.clientWidth) {
                high = mid;
            } else {
                low = mid;
            }
        }
        el.style.fontSize = `${low}px`;
    }

    function fitFooterCourseTitle() {
        fitTextToWidth(els.footerCourseTitle);
    }

    if (els.footerCourseTitle && typeof ResizeObserver !== 'undefined') {
        const footerTitleObserver = new ResizeObserver(() => fitFooterCourseTitle());
        footerTitleObserver.observe(els.footerCourseTitle);
    }
    window.addEventListener('resize', fitFooterCourseTitle);

    /**
     * Scale the fixed design canvas to fit the presentation stage (letterboxed).
     * Same idea as PowerPoint / Google Slides: composition is constant; only scale changes.
     */
    function scaleSlideToFit() {
        if (!els.presentationStage || !els.slideScaleShell || !els.slideCard) return;

        const stageStyle = getComputedStyle(els.presentationStage);
        const padX =
            (parseFloat(stageStyle.paddingLeft) || 0) + (parseFloat(stageStyle.paddingRight) || 0);
        const padY =
            (parseFloat(stageStyle.paddingTop) || 0) + (parseFloat(stageStyle.paddingBottom) || 0);

        const availW = Math.max(0, els.presentationStage.clientWidth - padX);
        const availH = Math.max(0, els.presentationStage.clientHeight - padY);
        if (availW < 2 || availH < 2) return;

        const scale = Math.min(availW / SLIDE_DESIGN_WIDTH, availH / SLIDE_DESIGN_HEIGHT);
        state.slideFitScale = scale;

        els.slideScaleShell.style.width = `${SLIDE_DESIGN_WIDTH * scale}px`;
        els.slideScaleShell.style.height = `${SLIDE_DESIGN_HEIGHT * scale}px`;
        els.slideCard.style.transform = `scale(${scale})`;

        api.resizeCanvas?.();
        fitFooterCourseTitle();
        api.layoutImageZoom?.();
    }

    window.addEventListener('resize', scaleSlideToFit);

    // Fullscreen Mode Toggle & Sync
    els.fullscreenToggle.addEventListener('click', toggleFullscreen);

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen mode: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }

    document.addEventListener('fullscreenchange', () => {
        const isFS = !!document.fullscreenElement;
        document.body.classList.toggle('is-fullscreen', isFS);
        setTimeout(api.scaleSlideToFit, 50);
        setTimeout(api.scaleSlideToFit, 250);
    });

    api.scaleSlideToFit = scaleSlideToFit;
    api.updateFontSize = updateFontSize;
    api.fitFooterCourseTitle = fitFooterCourseTitle;
    api.toggleFullscreen = toggleFullscreen;
    api.focusSlideStage = focusSlideStage;
}
