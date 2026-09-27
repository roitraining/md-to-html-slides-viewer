export const SLIDE_DESIGN_WIDTH = 1280;
export const SLIDE_DESIGN_HEIGHT = 720;
export const SLIDE_DESIGN_FONT_PX = 16;

export const state = {
    slideFitScale: 1,
    slides: [],
    currentIndex: 0,
    currentFontSize: 100,
    courseUrl: '',
    courseBaseUrl: '',
    localAssetMap: null,
    courseChapters: [],
    currentChapterId: null,
    currentShareUrl: null,
    openModalOpen: false,
    slideAnnotations: {},
    // Set when the viewer picks a theme from the toolbar for the open course.
    themeChosenForCourse: null
};

/** Folder identity for a course URL or local source key, ignoring the chapter file. */
export function courseThemeIdentity(sourceKey) {
    const key = String(sourceKey || '');
    if (!key) return '';
    if (key.startsWith('local:')) {
        const rest = key.slice('local:'.length);
        const slash = rest.lastIndexOf('/');
        return slash === -1 ? `local:${rest}` : `local:${rest.slice(0, slash)}`;
    }
    const slash = key.lastIndexOf('/');
    return slash === -1 ? key : key.slice(0, slash);
}

/** DOM nodes — filled by bindDom() before any init() runs. */
export const els = {};

/** Late-bound functions so feature modules can call each other without import cycles. */
export const api = {};

export function bindDom() {
    els.slideCard = document.getElementById('slide-card');
    els.slideBody = document.getElementById('slide-body');
    els.footerSlideNumber = document.getElementById('footer-slide-number');
    els.footerCourseTitle = document.getElementById('footer-course-title');
    els.progressBar = document.getElementById('progress-bar');
    els.courseTitle = document.getElementById('course-title');
    els.menuToggle = document.getElementById('menu-toggle');
    els.closeMenu = document.getElementById('close-menu');
    els.sideMenu = document.getElementById('side-menu');
    els.slideList = document.getElementById('slide-list');
    els.themeToggle = document.getElementById('theme-toggle');
    els.slideThemeSelect = document.getElementById('slide-theme-select');
    els.fontSizeDecrease = document.getElementById('font-size-decrease');
    els.fontSizeIncrease = document.getElementById('font-size-increase');
    els.fullscreenToggle = document.getElementById('fullscreen-toggle');
    els.presentationStage = document.getElementById('presentation-stage');
    els.slideScaleShell = document.getElementById('slide-scale-shell');
    els.pinMenuBtn = document.getElementById('pin-menu');
    els.drawerViewToggle = document.getElementById('drawer-view-toggle');
    els.chapterSelectWrap = document.getElementById('chapter-select-wrap');
    els.chapterSelect = document.getElementById('chapter-select');
    els.openCourseModal = document.getElementById('open-course-modal');
    els.openCourseStatus = document.getElementById('open-course-status');
    els.openCourseBrowser = document.getElementById('open-course-browser');
    els.copyShareLinkBtn = document.getElementById('copy-share-link');
    els.githubUrlInput = document.getElementById('github-url-input');
    els.exportPdfBtn = document.getElementById('export-pdf-btn');
    els.printStage = document.getElementById('print-stage');
    els.annotationCanvas = document.getElementById('annotation-canvas');
    els.penBtn = document.getElementById('pen-tool-btn');
    els.highlighterBtn = document.getElementById('highlighter-tool-btn');
    els.pointerBtn = document.getElementById('pointer-tool-btn');
    els.clearBtn = document.getElementById('clear-canvas-btn');
    els.slidePointer = document.getElementById('slide-pointer');
    els.deleteAllBtn = document.getElementById('delete-all-canvas-btn');
    els.flipchartBtn = document.getElementById('flipchart-btn');
    els.flipchartSheet = document.getElementById('flipchart-sheet');
    els.flipchartCanvas = document.getElementById('flipchart-canvas');
    els.flipchartClose = document.getElementById('flipchart-close');
}
