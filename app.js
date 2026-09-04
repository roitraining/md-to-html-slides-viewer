document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const slideCard = document.getElementById('slide-card');
    const slideBody = document.getElementById('slide-body');
    const footerSlideNumber = document.getElementById('footer-slide-number');
    const footerCourseTitle = document.getElementById('footer-course-title');
    const progressBar = document.getElementById('progress-bar');
    const courseTitle = document.getElementById('course-title');
    
    // Side Menu Drawer Elements
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sideMenu = document.getElementById('side-menu');
    const slideList = document.getElementById('slide-list');
    
    // Controls
    const themeToggle = document.getElementById('theme-toggle');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    
    // Application State
    let slides = [];
    let currentIndex = 0;
    let currentFontSize = 100;
    let courseUrl = '';
    let courseBaseUrl = '';
    let localAssetMap = null; // Map of relative path -> object URL
    let courseChapters = [];
    let currentChapterId = null;
    let currentShareUrl = null; // GitHub URL suitable for ?course=
    let openModalOpen = false;
    let slideAnnotations = {};
    
    // Theme initialization & toggle logic
    const savedTheme = localStorage.getItem('slides-viewer-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }
    
    themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-theme');
        themeToggle.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('slides-viewer-theme', isDark ? 'dark' : 'light');
    });
    
    // Font Scaling: 50%–200% in 25% steps (slider starts at 100% / middle)
    const FONT_SIZE_MIN = 50;
    const FONT_SIZE_MAX = 200;
    const FONT_SIZE_STEP = 25;

    function snapFontSize(value) {
        const n = parseInt(value, 10);
        if (Number.isNaN(n)) return 100;
        const snapped = Math.round(n / FONT_SIZE_STEP) * FONT_SIZE_STEP;
        return Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, snapped));
    }

    function syncFontSlider() {
        if (!fontSizeSlider) return;
        fontSizeSlider.value = String(currentFontSize);
        fontSizeSlider.setAttribute('aria-valuenow', String(currentFontSize));
        fontSizeSlider.setAttribute('aria-valuetext', `${currentFontSize} percent`);
        fontSizeSlider.title = `Text size: ${currentFontSize}%`;
    }

    function updateFontSize() {
        currentFontSize = snapFontSize(currentFontSize);
        if (slideCard) slideCard.style.fontSize = `${currentFontSize}%`;
        document.body.style.fontSize = `${currentFontSize}%`;
        localStorage.setItem('slides-viewer-font-size', currentFontSize);
        syncFontSlider();
        fitFooterCourseTitle();
    }

    const savedFontSize = localStorage.getItem('slides-viewer-font-size');
    if (savedFontSize) {
        currentFontSize = snapFontSize(savedFontSize);
    }
    updateFontSize();

    if (fontSizeSlider) {
        fontSizeSlider.addEventListener('input', () => {
            currentFontSize = snapFontSize(fontSizeSlider.value);
            updateFontSize();
        });
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
        fitTextToWidth(footerCourseTitle);
    }

    if (footerCourseTitle && typeof ResizeObserver !== 'undefined') {
        const footerTitleObserver = new ResizeObserver(() => fitFooterCourseTitle());
        footerTitleObserver.observe(footerCourseTitle);
    }
    window.addEventListener('resize', fitFooterCourseTitle);
    
    // Fullscreen Mode Toggle & Sync
    fullscreenToggle.addEventListener('click', toggleFullscreen);
    
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
    });
    
    // Side Menu Drawer interactions (open / pin / close)
    const pinMenuBtn = document.getElementById('pin-menu');
    const DRAWER_PIN_KEY = 'slides-viewer-drawer-pinned';
    let drawerPinned = localStorage.getItem(DRAWER_PIN_KEY) === 'true';

    function syncDrawerPinUi() {
        document.body.classList.toggle('drawer-pinned', drawerPinned);
        if (drawerPinned) {
            sideMenu.classList.add('open');
        }
        if (pinMenuBtn) {
            pinMenuBtn.setAttribute('aria-pressed', drawerPinned ? 'true' : 'false');
            pinMenuBtn.title = drawerPinned ? 'Unpin drawer' : 'Pin drawer open';
            pinMenuBtn.setAttribute(
                'aria-label',
                drawerPinned ? 'Unpin slide list' : 'Pin slide list open'
            );
        }
        // Stage width changes when docking — refresh annotation canvas if present
        if (typeof resizeCanvas === 'function') {
            setTimeout(resizeCanvas, 320);
        }
        if (typeof scaleAllThumbnails === 'function') {
            setTimeout(scaleAllThumbnails, 320);
        }
    }

    function setDrawerPinned(pinned) {
        drawerPinned = !!pinned;
        localStorage.setItem(DRAWER_PIN_KEY, drawerPinned ? 'true' : 'false');
        syncDrawerPinUi();
    }

    function openDrawer() {
        sideMenu.classList.add('open');
        if (typeof scaleAllThumbnails === 'function') {
            setTimeout(scaleAllThumbnails, 50);
            setTimeout(scaleAllThumbnails, 320);
        }
    }

    function closeDrawer() {
        if (drawerPinned) {
            setDrawerPinned(false);
        }
        sideMenu.classList.remove('open');
    }

    menuToggle.addEventListener('click', () => {
        if (drawerPinned) {
            // Already docked; treat hamburger as unpin + close
            closeDrawer();
            return;
        }
        if (sideMenu.classList.contains('open')) {
            closeDrawer();
        } else {
            openDrawer();
        }
    });

    closeMenu.addEventListener('click', closeDrawer);

    if (pinMenuBtn) {
        pinMenuBtn.addEventListener('click', () => {
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
    const drawerViewToggle = document.getElementById('drawer-view-toggle');
    const DRAWER_VIEW_KEY = 'slides-viewer-drawer-view';
    let drawerViewMode = localStorage.getItem(DRAWER_VIEW_KEY) === 'thumbs' ? 'thumbs' : 'list';
    let thumbObserver = null;

    function syncDrawerViewUi() {
        const isThumbs = drawerViewMode === 'thumbs';
        sideMenu.classList.toggle('view-thumbnails', isThumbs);
        if (drawerViewToggle) {
            drawerViewToggle.setAttribute('aria-pressed', isThumbs ? 'true' : 'false');
            drawerViewToggle.title = isThumbs ? 'Show titles' : 'Show thumbnails';
            drawerViewToggle.setAttribute(
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
            slideList.querySelectorAll('.slide-thumb-viewport').forEach(scaleThumbViewport);
        });
    }

    function renderSlideThumbnail(index, canvasEl) {
        if (!canvasEl || canvasEl.dataset.rendered === 'true' || !slides[index]) return;

        const slideMarkdown = slides[index];
        const layoutType = extractLayoutDirective(slideMarkdown, index);
        const body = canvasEl.querySelector('.slide-body');
        if (!body) return;

        canvasEl.classList.add(`layout-${layoutType}`);
        body.innerHTML = marked.parse(slideMarkdown);

        if (layoutType === 'navigation' || layoutType === 'section') {
            processNavigationLayout(body);
        } else if (layoutType === 'three-column') {
            processThreeColumnLayout(body);
        } else if (layoutType === 'two-column') {
            processTwoColumnLayout(body);
        } else if (layoutType === 'stacked') {
            processStackedLayout(body);
        }

        processGitHubAlerts(body);
        processRelativeImages(body);
        if (layoutType !== 'stacked') {
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
            root: sideMenu,
            rootMargin: '120px 0px',
            threshold: 0.01
        });
    }

    function observeThumbnails() {
        if (!thumbObserver) return;
        slideList.querySelectorAll('.slide-thumb-viewport').forEach((viewport) => {
            const canvas = viewport.querySelector('.slide-thumb-canvas');
            if (canvas && canvas.dataset.rendered === 'true') return;
            thumbObserver.observe(viewport);
        });
    }

    if (drawerViewToggle) {
        drawerViewToggle.addEventListener('click', () => {
            setDrawerViewMode(drawerViewMode === 'thumbs' ? 'list' : 'thumbs');
        });
    }

    if (typeof ResizeObserver !== 'undefined') {
        const thumbScaleObserver = new ResizeObserver(() => {
            if (drawerViewMode === 'thumbs') scaleAllThumbnails();
        });
        thumbScaleObserver.observe(sideMenu);
    }

    syncDrawerViewUi();
    // Marked syntax highlight options
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });
    
    // ─── Course loading ───────────────────────────────────────────────
    const IGNORED_DIR_NAMES = new Set([
        'images', 'image', 'img', 'assets', 'static', 'css', 'js', 'scripts',
        'node_modules', '.git', '.github', '.agents', '.vscode', 'fonts'
    ]);
    const RECENT_GITHUB_KEY = 'slides-viewer-recent-github';
    const chapterSelectWrap = document.getElementById('chapter-select-wrap');
    const chapterSelect = document.getElementById('chapter-select');
    const openCourseModal = document.getElementById('open-course-modal');
    const openCourseStatus = document.getElementById('open-course-status');
    const openCourseBrowser = document.getElementById('open-course-browser');
    const copyShareLinkBtn = document.getElementById('copy-share-link');
    const githubUrlInput = document.getElementById('github-url-input');

    function revokeLocalAssets() {
        if (localAssetMap) {
            localAssetMap.forEach((url) => {
                try { URL.revokeObjectURL(url); } catch (_) { /* ignore */ }
            });
        }
        localAssetMap = null;
    }

    function isMarkdownName(name) {
        return /\.(md|markdown)$/i.test(name || '');
    }

    function chapterLabelFromName(name) {
        return String(name || '')
            .replace(/\.(md|markdown)$/i, '')
            .replace(/[-_]+/g, ' ')
            .trim();
    }

    function sortChapterNames(names) {
        return [...names].sort((a, b) =>
            a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
        );
    }

    function looksLikeNumberedChapterSet(names) {
        const list = names || [];
        if (list.length <= 1) return true;
        const numbered = list.filter((n) => /^\d{2}[-_]/.test(n));
        // e.g. 00-intro.md … 08-security.md
        return numbered.length >= Math.max(2, Math.ceil(list.length * 0.6));
    }

    function filterCourseMarkdownFiles(items) {
        return (items || []).filter(
            (item) =>
                item.type === 'file' &&
                isMarkdownName(item.name) &&
                !/^readme\.(md|markdown)$/i.test(item.name)
        );
    }

    function pickDefaultChapter(names) {
        const sorted = sortChapterNames(names);
        const intro = sorted.find((n) => /introduction|intro|overview|00[-_]/i.test(n));
        return intro || sorted[0] || null;
    }

    function setOpenStatus(message, isError = false) {
        if (!openCourseStatus) return;
        openCourseStatus.textContent = message || '';
        openCourseStatus.classList.toggle('is-error', !!isError);
    }

    function clearOpenBrowser() {
        if (!openCourseBrowser) return;
        openCourseBrowser.hidden = true;
        openCourseBrowser.innerHTML = '';
    }

    function renderBrowserList(heading, items) {
        if (!openCourseBrowser) return;
        clearOpenBrowser();
        if (!items || !items.length) return;

        const headingEl = document.createElement('div');
        headingEl.className = 'course-browser-heading';
        headingEl.textContent = heading;

        const ul = document.createElement('ul');
        ul.className = 'course-browser-list';

        items.forEach((item) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            if (item.active) btn.classList.add('is-active');
            btn.innerHTML =
                `<span class="course-browser-item-title">${item.title}</span>` +
                (item.meta ? `<span class="course-browser-item-meta">${item.meta}</span>` : '');
            btn.addEventListener('click', () => item.onSelect());
            li.appendChild(btn);
            ul.appendChild(li);
        });

        openCourseBrowser.appendChild(headingEl);
        openCourseBrowser.appendChild(ul);
        openCourseBrowser.hidden = false;
    }

    function syncShareLinkButton() {
        if (!copyShareLinkBtn) return;
        copyShareLinkBtn.hidden = !currentShareUrl;
    }

    function updateBrowserCourseQuery(shareUrl) {
        const url = new URL(window.location.href);
        if (shareUrl) {
            url.searchParams.set('course', shareUrl);
        } else {
            url.searchParams.delete('course');
            url.searchParams.delete('lab');
            url.searchParams.delete('url');
        }
        const hash = window.location.hash || '';
        history.replaceState(null, '', `${url.pathname}${url.search}${hash}`);
    }

    function reloadAnnotationsForCourse() {
        slideAnnotations = {};
        const key = `slides-annotations-${courseUrl || 'default'}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                slideAnnotations = JSON.parse(saved);
            } catch (_) {
                slideAnnotations = {};
            }
        }
        if (typeof clearCanvas === 'function') clearCanvas();
        if (typeof clearSlidePointer === 'function') clearSlidePointer();
    }

    function saveAnnotationsToStorage() {
        const key = `slides-annotations-${courseUrl || 'default'}`;
        localStorage.setItem(key, JSON.stringify(slideAnnotations));
    }

    function updateChapterSelector() {
        if (!chapterSelect || !chapterSelectWrap) return;
        chapterSelect.innerHTML = '';

        if (!courseChapters || courseChapters.length <= 1) {
            chapterSelectWrap.hidden = true;
            return;
        }

        courseChapters.forEach((ch) => {
            const opt = document.createElement('option');
            opt.value = ch.id;
            opt.textContent = ch.label;
            if (ch.id === currentChapterId) opt.selected = true;
            chapterSelect.appendChild(opt);
        });
        chapterSelectWrap.hidden = false;
    }

    function applyCourseMarkdown(markdownText, options = {}) {
        const {
            sourceKey,
            baseUrl = '',
            assetMap = null,
            shareUrl = null,
            chapters = null,
            chapterId = null
        } = options;

        revokeLocalAssets();
        localAssetMap = assetMap;
        courseUrl = sourceKey || 'course';
        courseBaseUrl = baseUrl || '';
        currentShareUrl = shareUrl || null;

        if (chapters) {
            courseChapters = chapters;
            currentChapterId = chapterId || (chapters[0] && chapters[0].id) || null;
        }

        slides = markdownText
            .split(/\r?\n---\r?\n/)
            .map((slide) => slide.trim())
            .filter((slide) => slide.length > 0);

        if (slides.length === 0) {
            slideBody.innerHTML = '<div class="error">No slides found in the specified Markdown file.</div>';
            updateChapterSelector();
            syncShareLinkButton();
            return;
        }

        const commentMatch = markdownText.match(
            /<!--\s*(?:course-title|course_title|course|footer-title|footer_title):\s*(.*?)\s*-->/i
        );
        const customCourseTitle = commentMatch ? commentMatch[1].trim() : '';

        if (customCourseTitle) {
            if (footerCourseTitle) footerCourseTitle.textContent = customCourseTitle;
            if (courseTitle) courseTitle.textContent = customCourseTitle;
            requestAnimationFrame(() => fitFooterCourseTitle());
        }

        reloadAnnotationsForCourse();
        buildSlideDrawer(customCourseTitle);
        updateChapterSelector();
        syncShareLinkButton();
        updateBrowserCourseQuery(currentShareUrl);

        const hash = window.location.hash;
        let initialIndex = 0;
        if (hash) {
            const match = hash.match(/#(?:slide-)?(\d+)/i);
            if (match) {
                initialIndex = parseInt(match[1], 10) - 1;
            }
        }
        goToSlide(initialIndex);
    }

    async function fetchText(url) {
        // Bust HTTP cache so local course edits show up on refresh
        let requestUrl = url;
        try {
            const resolved = new URL(url, window.location.href);
            if (resolved.origin === window.location.origin) {
                resolved.searchParams.set('_', String(Date.now()));
                requestUrl = resolved.pathname + resolved.search + resolved.hash;
            }
        } catch (_) { /* keep original url */ }

        const response = await fetch(requestUrl, { cache: 'no-store' });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} loading ${url}`);
        }
        return response.text();
    }

    function githubRawUrl(owner, repo, ref, filePath) {
        const clean = String(filePath || '').replace(/^\/+/, '');
        return `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${clean}`;
    }

    function githubBlobUrl(owner, repo, ref, filePath) {
        const clean = String(filePath || '').replace(/^\/+/, '');
        return `https://github.com/${owner}/${repo}/blob/${ref}/${clean}`;
    }

    function githubTreeUrl(owner, repo, ref, dirPath) {
        const clean = String(dirPath || '').replace(/^\/+|\/+$/g, '');
        return clean
            ? `https://github.com/${owner}/${repo}/tree/${ref}/${clean}`
            : `https://github.com/${owner}/${repo}/tree/${ref}`;
    }

    function parseGitHubUrl(input) {
        const trimmed = String(input || '').trim();
        if (!trimmed) return null;

        let m = trimmed.match(
            /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.*)$/i
        );
        if (m) {
            const path = m[4].replace(/\/+$/, '');
            return {
                owner: m[1],
                repo: m[2],
                ref: m[3],
                path,
                isFile: isMarkdownName(path)
            };
        }

        m = trimmed.match(
            /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/(tree|blob)\/([^/?#]+)(?:\/(.*))?)?\/?(?:[?#].*)?$/i
        );
        if (m) {
            const owner = m[1];
            const repo = m[2];
            const kind = m[3] || null;
            const ref = m[4] || null;
            const path = (m[5] || '').replace(/\/+$/, '');
            const isFile = kind === 'blob' || isMarkdownName(path);
            return { owner, repo, ref, path, isFile };
        }

        // Shorthand: owner/repo or owner/repo/path (NOT local relative paths like hca/01-course/course.md).
        // Ambiguous nested paths are resolved in bootFromQueryOrDefault by preferring a same-origin file.
        m = trimmed.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)(?:\/(.+))?$/);
        if (m && !trimmed.includes('://') && !trimmed.startsWith('.') && !isMarkdownName(m[2])) {
            const path = (m[3] || '').replace(/\/+$/, '');
            return {
                owner: m[1],
                repo: m[2],
                ref: null,
                path,
                isFile: isMarkdownName(path),
                // Nested "owner/repo/file.md" can collide with local course paths
                ambiguousLocal: Boolean(path)
            };
        }

        return null;
    }

    async function sameOriginResourceExists(path) {
        if (!path || path.includes('://')) return false;
        try {
            const response = await fetch(path, { method: 'HEAD' });
            if (response.ok) return true;
            // Some static servers (or mid proxies) reject HEAD — fall back to GET range/full
            if (response.status === 405 || response.status === 501) {
                const getResponse = await fetch(path, { method: 'GET' });
                return getResponse.ok;
            }
        } catch (_) { /* not available locally */ }
        return false;
    }

    async function githubApiFetch(apiPath) {
        const response = await fetch(`https://api.github.com${apiPath}`, {
            headers: { Accept: 'application/vnd.github+json' }
        });
        if (!response.ok) {
            let detail = `GitHub API ${response.status}`;
            try {
                const body = await response.json();
                if (body && body.message) detail = body.message;
            } catch (_) { /* ignore */ }
            const err = new Error(detail);
            err.status = response.status;
            throw err;
        }
        return response.json();
    }

    async function resolveGitHubRef(owner, repo, preferredRef) {
        if (preferredRef) return preferredRef;
        const info = await githubApiFetch(`/repos/${owner}/${repo}`);
        return info.default_branch || 'main';
    }

    async function listGitHubContents(owner, repo, path, ref) {
        const cleanPath = String(path || '').replace(/^\/+|\/+$/g, '');
        const encodedPath = cleanPath
            .split('/')
            .filter(Boolean)
            .map(encodeURIComponent)
            .join('/');
        const q = `?ref=${encodeURIComponent(ref)}`;
        const apiPath = encodedPath
            ? `/repos/${owner}/${repo}/contents/${encodedPath}${q}`
            : `/repos/${owner}/${repo}/contents${q}`;
        return githubApiFetch(apiPath);
    }

    function getRecentGitHubUrls() {
        try {
            const raw = localStorage.getItem(RECENT_GITHUB_KEY);
            const list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list.filter((u) => typeof u === 'string') : [];
        } catch (_) {
            return [];
        }
    }

    function rememberGitHubUrl(url) {
        if (!url) return;
        const next = [url, ...getRecentGitHubUrls().filter((u) => u !== url)].slice(0, 8);
        localStorage.setItem(RECENT_GITHUB_KEY, JSON.stringify(next));
        renderGitHubRecents();
    }

    function renderGitHubRecents() {
        const wrap = document.getElementById('github-recents');
        const list = document.getElementById('github-recents-list');
        if (!wrap || !list) return;
        const recents = getRecentGitHubUrls();
        list.innerHTML = '';
        if (!recents.length) {
            wrap.hidden = true;
            return;
        }
        recents.forEach((url) => {
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = url;
            btn.title = url;
            btn.addEventListener('click', () => {
                if (githubUrlInput) githubUrlInput.value = url;
                browseGitHubUrl(url);
            });
            li.appendChild(btn);
            list.appendChild(li);
        });
        wrap.hidden = false;
    }

    async function loadRemoteMarkdown(rawUrl, shareUrl, chapterState = null) {
        setOpenStatus('Loading slides…');
        const markdownText = await fetchText(rawUrl);
        // Resolve against the page URL so nested local courses (hca/01-…/course.md)
        // rewrite images/… to absolute paths under that course folder — not /images/….
        const baseUrl = new URL(
            rawUrl.substring(0, rawUrl.lastIndexOf('/') + 1) || './',
            window.location.href
        ).href;
        applyCourseMarkdown(markdownText, {
            sourceKey: rawUrl,
            baseUrl,
            shareUrl: shareUrl || rawUrl,
            chapters: chapterState ? chapterState.chapters : courseChapters,
            chapterId: chapterState ? chapterState.chapterId : currentChapterId
        });
        setOpenStatus('Course loaded.');
        closeOpenModal();
    }

    function buildGitHubChapters(owner, repo, ref, dirPath, mdFiles) {
        const sorted = sortChapterNames(mdFiles.map((f) => f.name));
        return sorted.map((name) => {
            const filePath = dirPath ? `${dirPath.replace(/\/+$/, '')}/${name}` : name;
            return {
                id: name,
                label: chapterLabelFromName(name),
                kind: 'github',
                rawUrl: githubRawUrl(owner, repo, ref, filePath),
                shareUrl: githubBlobUrl(owner, repo, ref, filePath)
            };
        });
    }

    async function openGitHubCourseFolder(owner, repo, ref, dirPath, mdFiles) {
        const chapters = buildGitHubChapters(owner, repo, ref, dirPath, mdFiles);
        courseChapters = chapters;
        const defaultName = pickDefaultChapter(chapters.map((c) => c.id));
        const chapter = chapters.find((c) => c.id === defaultName) || chapters[0];

        renderBrowserList(
            'Chapters',
            chapters.map((ch) => ({
                title: ch.label,
                meta: ch.id,
                active: ch.id === chapter.id,
                onSelect: () => loadGitHubChapter(ch)
            }))
        );

        rememberGitHubUrl(githubTreeUrl(owner, repo, ref, dirPath));
        await loadGitHubChapter(chapter);
    }

    async function loadGitHubChapter(chapter) {
        currentChapterId = chapter.id;
        await loadRemoteMarkdown(chapter.rawUrl, chapter.shareUrl, {
            chapters: courseChapters,
            chapterId: chapter.id
        });
        updateChapterSelector();
    }

    async function inspectGitHubDirectory(owner, repo, ref, dirPath) {
        setOpenStatus(`Browsing ${dirPath || 'repository root'}…`);
        const listing = await listGitHubContents(owner, repo, dirPath, ref);
        if (!Array.isArray(listing)) {
            if (listing && listing.type === 'file' && isMarkdownName(listing.name)) {
                const shareUrl = githubBlobUrl(owner, repo, ref, listing.path || listing.name);
                const rawUrl = listing.download_url || githubRawUrl(owner, repo, ref, listing.path || listing.name);
                courseChapters = [];
                currentChapterId = null;
                rememberGitHubUrl(shareUrl);
                await loadRemoteMarkdown(rawUrl, shareUrl, { chapters: [], chapterId: null });
                return;
            }
            throw new Error('Unexpected GitHub response for that path.');
        }

        const mdFiles = filterCourseMarkdownFiles(listing);
        const dirs = listing.filter(
            (item) => item.type === 'dir' && !IGNORED_DIR_NAMES.has(item.name.toLowerCase())
        );

        if (mdFiles.length > 0) {
            const names = mdFiles.map((f) => f.name);
            if (mdFiles.length > 1 && !looksLikeNumberedChapterSet(names)) {
                // Independent course files in one folder (e.g. course-a.md, course-b.md)
                setOpenStatus(`Found ${mdFiles.length} course files. Pick one.`);
                rememberGitHubUrl(githubTreeUrl(owner, repo, ref, dirPath));
                renderBrowserList(
                    'Courses',
                    mdFiles.map((file) => ({
                        title: chapterLabelFromName(file.name),
                        meta: file.name,
                        onSelect: async () => {
                            try {
                                const filePath = dirPath
                                    ? `${dirPath.replace(/\/+$/, '')}/${file.name}`
                                    : file.name;
                                const rawUrl = githubRawUrl(owner, repo, ref, filePath);
                                const shareUrl = githubBlobUrl(owner, repo, ref, filePath);
                                courseChapters = [];
                                currentChapterId = null;
                                rememberGitHubUrl(shareUrl);
                                await loadRemoteMarkdown(rawUrl, shareUrl, {
                                    chapters: [],
                                    chapterId: null
                                });
                            } catch (err) {
                                setOpenStatus(err.message || String(err), true);
                            }
                        }
                    }))
                );
                return;
            }

            await openGitHubCourseFolder(owner, repo, ref, dirPath, mdFiles);
            return;
        }

        if (dirs.length === 0) {
            throw new Error('No Markdown course files or course folders found at that path.');
        }

        // Multi-course repo / parent folder: list directories for the user to pick
        setOpenStatus(
            dirs.length === 1
                ? 'Found one folder. Opening it…'
                : `Found ${dirs.length} folders. Pick a course folder.`
        );

        if (dirs.length === 1) {
            const only = dirs[0];
            const nextPath = dirPath ? `${dirPath.replace(/\/+$/, '')}/${only.name}` : only.name;
            await inspectGitHubDirectory(owner, repo, ref, nextPath);
            return;
        }

        rememberGitHubUrl(githubTreeUrl(owner, repo, ref, dirPath));
        renderBrowserList(
            'Course folders',
            dirs.map((dir) => ({
                title: dir.name,
                meta: 'Open folder',
                onSelect: async () => {
                    try {
                        const nextPath = dirPath ? `${dirPath.replace(/\/+$/, '')}/${dir.name}` : dir.name;
                        await inspectGitHubDirectory(owner, repo, ref, nextPath);
                    } catch (err) {
                        setOpenStatus(err.message || String(err), true);
                    }
                }
            }))
        );
    }

    async function browseGitHubUrl(inputUrl) {
        clearOpenBrowser();
        setOpenStatus('');
        const parsed = parseGitHubUrl(inputUrl);
        if (!parsed) {
            setOpenStatus('Enter a valid GitHub URL (repo, folder, or .md file).', true);
            return;
        }

        try {
            const ref = await resolveGitHubRef(parsed.owner, parsed.repo, parsed.ref);
            if (parsed.isFile && parsed.path) {
                setOpenStatus('Loading Markdown file…');
                const rawUrl = githubRawUrl(parsed.owner, parsed.repo, ref, parsed.path);
                const shareUrl = githubBlobUrl(parsed.owner, parsed.repo, ref, parsed.path);
                courseChapters = [];
                currentChapterId = null;
                rememberGitHubUrl(shareUrl);
                await loadRemoteMarkdown(rawUrl, shareUrl, { chapters: [], chapterId: null });
                return;
            }
            await inspectGitHubDirectory(parsed.owner, parsed.repo, ref, parsed.path || '');
        } catch (err) {
            console.error(err);
            setOpenStatus(err.message || String(err), true);
        }
    }

    // ─── Local file / folder ──────────────────────────────────────────
    function normalizeRelPath(path) {
        return String(path || '').replace(/\\/g, '/').replace(/^\.\//, '');
    }

    function analyzeLocalFiles(fileList) {
        const files = Array.from(fileList || []).map((file) => ({
            file,
            path: normalizeRelPath(file.webkitRelativePath || file.name)
        }));

        const mdFiles = files.filter((f) => isMarkdownName(f.path));
        if (!mdFiles.length) {
            throw new Error('No Markdown (.md) files found in the selection.');
        }

        // Group markdown files by their parent directory
        const byDir = new Map();
        mdFiles.forEach((f) => {
            const parts = f.path.split('/');
            const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '';
            if (!byDir.has(dir)) byDir.set(dir, []);
            byDir.get(dir).push(f);
        });

        // Prefer deepest common course dirs (ignore nested ones that are only images parents)
        const courses = [...byDir.entries()].map(([dir, mds]) => ({
            id: dir || '(root)',
            dir,
            label: dir ? dir.split('/').filter(Boolean).pop() : 'Selected files',
            mdFiles: mds,
            files
        }));

        // If multiple nested dirs, prefer those that look like courses (have numbered chapters or several md files)
        courses.sort((a, b) => a.dir.localeCompare(b.dir));
        return { files, courses };
    }

    function buildLocalAssetMap(courseDir, allFiles) {
        const map = new Map();
        const prefix = courseDir ? `${courseDir.replace(/\/+$/, '')}/` : '';
        allFiles.forEach(({ file, path }) => {
            if (prefix && !path.startsWith(prefix)) return;
            if (!prefix && path.includes('/')) {
                // Single-file open from a flat picker: only map same-folder assets if any
            }
            const rel = prefix ? path.slice(prefix.length) : path.split('/').pop();
            if (!rel || isMarkdownName(rel)) return;
            map.set(rel, URL.createObjectURL(file));
        });
        return map;
    }

    async function loadLocalChapter(chapter, allFiles, courseDir, chapters) {
        const text = await chapter.file.text();
        const assetMap = buildLocalAssetMap(courseDir, allFiles);
        currentChapterId = chapter.id;
        applyCourseMarkdown(text, {
            sourceKey: `local:${courseDir || ''}/${chapter.id}`,
            baseUrl: '',
            assetMap,
            shareUrl: null,
            chapters,
            chapterId: chapter.id
        });
        setOpenStatus('Local course loaded. (Share links are only available for GitHub courses.)');
        closeOpenModal();
    }

    async function openLocalCourse(course) {
        const names = sortChapterNames(course.mdFiles.map((f) => f.path.split('/').pop()));
        const chapters = names.map((name) => {
            const entry = course.mdFiles.find((f) => f.path.endsWith('/' + name) || f.path === name);
            return {
                id: name,
                label: chapterLabelFromName(name),
                kind: 'local',
                file: entry.file,
                courseDir: course.dir,
                allFiles: course.files
            };
        });

        courseChapters = chapters;
        const defaultName = pickDefaultChapter(names);
        const chapter = chapters.find((c) => c.id === defaultName) || chapters[0];

        if (chapters.length > 1) {
            renderBrowserList(
                'Chapters',
                chapters.map((ch) => ({
                    title: ch.label,
                    meta: ch.id,
                    active: ch.id === chapter.id,
                    onSelect: () => loadLocalChapter(ch, course.files, course.dir, chapters)
                }))
            );
        }

        await loadLocalChapter(chapter, course.files, course.dir, chapters);
    }

    async function handleLocalFolderFiles(fileList) {
        clearOpenBrowser();
        setOpenStatus('Scanning folder…');
        try {
            const { courses } = analyzeLocalFiles(fileList);
            if (courses.length === 1) {
                await openLocalCourse(courses[0]);
                return;
            }

            // Multiple course folders under the selection
            setOpenStatus(`Found ${courses.length} course folders. Pick one.`);
            renderBrowserList(
                'Courses',
                courses.map((course) => ({
                    title: course.label,
                    meta: `${course.mdFiles.length} Markdown file${course.mdFiles.length === 1 ? '' : 's'}`,
                    onSelect: async () => {
                        try {
                            await openLocalCourse(course);
                        } catch (err) {
                            setOpenStatus(err.message || String(err), true);
                        }
                    }
                }))
            );
        } catch (err) {
            console.error(err);
            setOpenStatus(err.message || String(err), true);
        }
    }

    async function handleLocalSingleFile(file) {
        clearOpenBrowser();
        setOpenStatus('Loading file…');
        try {
            const text = await file.text();
            courseChapters = [];
            currentChapterId = null;
            applyCourseMarkdown(text, {
                sourceKey: `local-file:${file.name}`,
                baseUrl: '',
                assetMap: null,
                shareUrl: null,
                chapters: [],
                chapterId: null
            });
            setOpenStatus(
                'File loaded. Tip: choose the course folder if images or other chapters should resolve.'
            );
            closeOpenModal();
        } catch (err) {
            console.error(err);
            setOpenStatus(err.message || String(err), true);
        }
    }

    // ─── Open modal UI ────────────────────────────────────────────────
    function openOpenModal(tab = null) {
        if (!openCourseModal) return;
        openCourseModal.hidden = false;
        openCourseModal.setAttribute('aria-hidden', 'false');
        openModalOpen = true;
        setOpenStatus('');
        syncShareLinkButton();
        renderGitHubRecents();
        if (tab) switchOpenTab(tab);
        const focusEl =
            (tab === 'github' ? githubUrlInput : document.getElementById('pick-local-file')) ||
            document.getElementById('open-course-close');
        if (focusEl && focusEl.focus) setTimeout(() => focusEl.focus(), 0);
    }

    function closeOpenModal() {
        if (!openCourseModal) return;
        openCourseModal.hidden = true;
        openCourseModal.setAttribute('aria-hidden', 'true');
        openModalOpen = false;
    }

    function switchOpenTab(tabName) {
        document.querySelectorAll('.modal-tab').forEach((tab) => {
            const active = tab.dataset.tab === tabName;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        document.querySelectorAll('.modal-panel').forEach((panel) => {
            panel.hidden = panel.dataset.panel !== tabName;
        });
    }

    function wireOpenCourseUi() {
        const openBtn = document.getElementById('open-course-btn');
        const closeBtn = document.getElementById('open-course-close');
        const cancelBtn = document.getElementById('open-course-cancel');
        const pickFileBtn = document.getElementById('pick-local-file');
        const pickFolderBtn = document.getElementById('pick-local-folder');
        const fileInput = document.getElementById('local-file-input');
        const folderInput = document.getElementById('local-folder-input');
        const browseBtn = document.getElementById('github-browse-btn');

        if (openBtn) openBtn.addEventListener('click', () => openOpenModal());
        if (closeBtn) closeBtn.addEventListener('click', closeOpenModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeOpenModal);

        if (openCourseModal) {
            openCourseModal.addEventListener('click', (e) => {
                if (e.target === openCourseModal) closeOpenModal();
            });
        }

        document.querySelectorAll('.modal-tab').forEach((tab) => {
            tab.addEventListener('click', () => switchOpenTab(tab.dataset.tab));
        });

        if (pickFileBtn && fileInput) {
            pickFileBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', () => {
                const file = fileInput.files && fileInput.files[0];
                if (file) handleLocalSingleFile(file);
                fileInput.value = '';
            });
        }

        if (pickFolderBtn && folderInput) {
            pickFolderBtn.addEventListener('click', async () => {
                if (window.showDirectoryPicker) {
                    try {
                        const dirHandle = await window.showDirectoryPicker();
                        const collected = [];
                        async function walk(handle, prefix) {
                            for await (const entry of handle.values()) {
                                const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
                                if (entry.kind === 'file') {
                                    const file = await entry.getFile();
                                    // Synthesize webkitRelativePath-like field
                                    Object.defineProperty(file, 'webkitRelativePath', {
                                        value: rel,
                                        configurable: true
                                    });
                                    collected.push(file);
                                } else if (entry.kind === 'directory') {
                                    const lower = entry.name.toLowerCase();
                                    // Skip noise dirs, but always walk media folders used by courses
                                    const mediaDirs = new Set(['images', 'image', 'img', 'assets']);
                                    if (IGNORED_DIR_NAMES.has(lower) && !mediaDirs.has(lower)) continue;
                                    await walk(entry, rel);
                                }
                            }
                        }
                        await walk(dirHandle, dirHandle.name);
                        await handleLocalFolderFiles(collected);
                        return;
                    } catch (err) {
                        if (err && err.name === 'AbortError') return;
                        console.warn('showDirectoryPicker failed, falling back to input', err);
                    }
                }
                folderInput.click();
            });

            folderInput.addEventListener('change', () => {
                if (folderInput.files && folderInput.files.length) {
                    handleLocalFolderFiles(folderInput.files);
                }
                folderInput.value = '';
            });
        }

        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                browseGitHubUrl(githubUrlInput ? githubUrlInput.value : '');
            });
        }
        if (githubUrlInput) {
            githubUrlInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    browseGitHubUrl(githubUrlInput.value);
                }
            });
        }

        if (copyShareLinkBtn) {
            copyShareLinkBtn.addEventListener('click', async () => {
                if (!currentShareUrl) return;
                const sharePage = new URL(window.location.href);
                sharePage.searchParams.set('course', currentShareUrl);
                try {
                    await navigator.clipboard.writeText(sharePage.toString());
                    setOpenStatus('Share link copied to clipboard.');
                } catch (_) {
                    setOpenStatus(sharePage.toString());
                }
            });
        }

        if (chapterSelect) {
            chapterSelect.addEventListener('change', async () => {
                const chapter = courseChapters.find((c) => c.id === chapterSelect.value);
                if (!chapter) return;
                try {
                    if (chapter.kind === 'github') {
                        await loadGitHubChapter(chapter);
                    } else if (chapter.kind === 'local') {
                        await loadLocalChapter(chapter, chapter.allFiles, chapter.courseDir, courseChapters);
                    }
                } catch (err) {
                    console.error(err);
                    slideBody.innerHTML = `<div class="error"><strong>Failed to load chapter:</strong><br>${err.message}</div>`;
                }
            });
        }
    }

    wireOpenCourseUi();

    async function bootFromQueryOrDefault() {
        const urlParams = new URLSearchParams(window.location.search);
        let paramUrl = urlParams.get('course') || urlParams.get('lab') || urlParams.get('url');

        if (!paramUrl) {
            const sampleUrl = './sample-course.md';
            try {
                await loadRemoteMarkdown(sampleUrl, null, { chapters: [], chapterId: null });
                setOpenStatus('');
            } catch (error) {
                console.error('Error loading course:', error);
                slideBody.innerHTML = `<div class="error">
                    <strong>Failed to load course slides from URL:</strong><br>
                    <code>${sampleUrl}</code><br><br>
                    <strong>Error:</strong> ${error.message}
                </div>`;
            }
            return;
        }

        // Convert github web URLs; if folder/repo, use discovery instead of README.md
        const gh = parseGitHubUrl(paramUrl);
        if (gh) {
            // Prefer a real local/same-origin Markdown file over GitHub shorthand like
            // hca/01-some-course/course.md (which looks like owner/repo/path).
            if (!paramUrl.includes('://') && (gh.ambiguousLocal || gh.isFile)) {
                const localExists = await sameOriginResourceExists(paramUrl);
                if (localExists) {
                    try {
                        await loadRemoteMarkdown(paramUrl, null, { chapters: [], chapterId: null });
                        return;
                    } catch (error) {
                        console.warn('Local course path exists but failed to load; trying GitHub.', error);
                    }
                }
            }
            try {
                const ref = await resolveGitHubRef(gh.owner, gh.repo, gh.ref);
                if (gh.isFile && gh.path) {
                    const rawUrl = githubRawUrl(gh.owner, gh.repo, ref, gh.path);
                    const shareUrl = githubBlobUrl(gh.owner, gh.repo, ref, gh.path);
                    await loadRemoteMarkdown(rawUrl, shareUrl, { chapters: [], chapterId: null });
                    // Also discover sibling chapters when possible
                    try {
                        const dirPath = gh.path.includes('/')
                            ? gh.path.split('/').slice(0, -1).join('/')
                            : '';
                        const listing = await listGitHubContents(gh.owner, gh.repo, dirPath, ref);
                        if (Array.isArray(listing)) {
                            const mdFiles = filterCourseMarkdownFiles(listing);
                            if (mdFiles.length > 1 && looksLikeNumberedChapterSet(mdFiles.map((i) => i.name))) {
                                courseChapters = buildGitHubChapters(gh.owner, gh.repo, ref, dirPath, mdFiles);
                                currentChapterId = gh.path.split('/').pop();
                                updateChapterSelector();
                            }
                        }
                    } catch (_) { /* sibling discovery is best-effort */ }
                    return;
                }
                openOpenModal('github');
                if (githubUrlInput) githubUrlInput.value = paramUrl;
                await inspectGitHubDirectory(gh.owner, gh.repo, ref, gh.path || '');
                return;
            } catch (error) {
                console.error('Error loading course:', error);
                slideBody.innerHTML = `<div class="error">
                    <strong>Failed to load course from GitHub:</strong><br>
                    <code>${paramUrl}</code><br><br>
                    <strong>Error:</strong> ${error.message}<br><br>
                    Use the <strong>Open</strong> button to try again.
                </div>`;
                return;
            }
        }

        // Non-GitHub URL (relative or absolute)
        if (paramUrl.startsWith('https://github.com/')) {
            // Fallback leftover conversion
            paramUrl = paramUrl
                .replace('https://github.com/', 'https://raw.githubusercontent.com/')
                .replace('/blob/', '/')
                .replace('/tree/', '/');
        }

        try {
            const shareUrl = paramUrl.startsWith('http') ? paramUrl : null;
            await loadRemoteMarkdown(paramUrl, shareUrl, { chapters: [], chapterId: null });
        } catch (error) {
            console.error('Error loading course:', error);
            slideBody.innerHTML = `<div class="error">
                <strong>Failed to load course slides from URL:</strong><br>
                <code>${paramUrl}</code><br><br>
                <strong>Error:</strong> ${error.message}
            </div>`;
        }
    }

    bootFromQueryOrDefault();

    // Slide Drawer Generator
    function buildSlideDrawer(customCourseTitle) {
        if (thumbObserver) {
            thumbObserver.disconnect();
        }
        slideList.innerHTML = '';
        slides.forEach((slideMarkdown, index) => {
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
                courseTitle.textContent = title;
                if (footerCourseTitle) {
                    footerCourseTitle.textContent = title;
                    requestAnimationFrame(() => fitFooterCourseTitle());
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
                goToSlide(index);
                if (!drawerPinned) {
                    sideMenu.classList.remove('open');
                }
            });
            
            li.appendChild(a);
            slideList.appendChild(li);
        });

        if (drawerViewMode === 'thumbs') {
            ensureThumbObserver();
            observeThumbnails();
            scaleAllThumbnails();
        }
    }

    // Go to specific slide
    function goToSlide(index) {
        if (slides.length === 0) return;
        
        // Clamp index bounds
        currentIndex = Math.max(0, Math.min(index, slides.length - 1));
        renderSlide(currentIndex);
    }

    function prevSlide() {
        if (currentIndex > 0) {
            goToSlide(currentIndex - 1);
        }
    }

    function nextSlide() {
        if (currentIndex < slides.length - 1) {
            goToSlide(currentIndex + 1);
        }
    }

    // Render Slide Content
    function renderSlide(index) {
        const slideMarkdown = slides[index];
        const layoutType = extractLayoutDirective(slideMarkdown, index);
        const html = marked.parse(slideMarkdown);
        
        // Remove existing layout classes and add new layout class
        slideCard.classList.remove('layout-title', 'layout-navigation', 'layout-section', 'layout-split', 'layout-content', 'layout-three-column', 'layout-title-image', 'layout-two-column', 'layout-stacked');
        slideCard.classList.add(`layout-${layoutType}`);
        
        // Re-trigger fade animation
        slideCard.classList.remove('slide-card');
        void slideCard.offsetWidth; // Trigger reflow
        slideCard.classList.add('slide-card');
        
        slideBody.innerHTML = html;
        
        // Apply current font scaling
        updateFontSize();
        
        // Process layout specific styling
        if (layoutType === 'navigation' || layoutType === 'section') {
            processNavigationLayout(slideBody);
        } else if (layoutType === 'three-column') {
            processThreeColumnLayout(slideBody);
        } else if (layoutType === 'two-column') {
            processTwoColumnLayout(slideBody);
        } else if (layoutType === 'stacked') {
            processStackedLayout(slideBody);
        }
        
        // Process GitHub Callout Alerts
        processGitHubAlerts(slideBody);
        
        // Resolve relative image URLs
        processRelativeImages(slideBody);
        
        // Auto-format 2-column layout (bullets left, image right) — skipped for stacked
        if (layoutType !== 'stacked') {
            processSplitLayouts(slideBody);
        }
        
        // Setup code block copy buttons
        processCodeCopyButtons(slideBody);
        
        // Ensure links open in a new tab
        processExternalLinks(slideBody);
        
        // Update ROI Slide Footer Counter (e.g. 1 of 12)
        footerSlideNumber.textContent = `${index + 1} of ${slides.length}`;
        
        // Update Progress Bar
        const progressPercent = ((index + 1) / slides.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Redraw persistent annotations for the current slide
        if (typeof redrawCurrentSlideAnnotations === 'function') {
            setTimeout(redrawCurrentSlideAnnotations, 50);
        }
        // Pointer is ephemeral — only one target at a time, cleared on slide change
        if (typeof clearSlidePointer === 'function') {
            clearSlidePointer();
        }
        
        // Update Active Item in Side Drawer
        const drawerLinks = slideList.querySelectorAll('a');
        drawerLinks.forEach((link, idx) => {
            if (idx === index) {
                link.classList.add('active');
                // Keep the active slide visible when the drawer is docked
                if (drawerPinned || sideMenu.classList.contains('open')) {
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

    // Process GitHub Callout Alerts
    function processGitHubAlerts(container) {
        const blockquotes = container.querySelectorAll('blockquote');
        blockquotes.forEach(bq => {
            const firstP = bq.querySelector('p');
            if (firstP) {
                const match = firstP.innerHTML.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/i);
                if (match) {
                    const type = match[1].toLowerCase();
                    bq.classList.add('markdown-alert', `markdown-alert-${type}`);
                    
                    firstP.innerHTML = firstP.innerHTML.substring(match[0].length).replace(/^<br\s*\/?>\s*/i, '');
                    
                    const title = document.createElement('div');
                    title.className = 'markdown-alert-title';
                    
                    const icons = {
                        note: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm8-6.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM6.5 7.75A.75.75 0 0 1 7.25 7h1a.75.75 0 0 1 .75.75v2.75h.25a.75.75 0 0 1 0 1.5h-2a.75.75 0 0 1 0-1.5h.25v-2h-.25a.75.75 0 0 1-.75-.75ZM8 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>',
                        tip: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M8 1.5c-2.363 0-4 1.69-4 3.75 0 .984.424 1.625.984 2.304l.214.253c.223.264.47.556.673.848.284.411.537.896.621 1.49a.75.75 0 0 1-1.484.211c-.04-.282-.163-.547-.37-.847a8.456 8.456 0 0 0-.542-.68c-.084-.1-.173-.205-.268-.32C3.201 7.75 2.5 6.766 2.5 5.25 2.5 2.31 4.863 0 8 0s5.5 2.31 5.5 5.25c0 1.516-.701 2.5-1.328 3.259-.095.115-.184.22-.268.319-.207.245-.383.453-.541.681-.208.3-.33.565-.37.847a.75.75 0 0 1-1.485-.212c.084-.593.337-1.078.621-1.489.203-.292.45-.584.673-.848.075-.088.147-.173.213-.253.561-.679.985-1.32.985-2.304 0-2.06-1.637-3.75-4-3.75ZM5.75 12h4.5a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1 0-1.5ZM6 15.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5a.75.75 0 0 1-.75-.75Z"></path></svg>',
                        important: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v9.5A1.75 1.75 0 0 1 14.25 13H8.06l-2.573 2.573A1.458 1.458 0 0 1 3 14.543V13H1.75A1.75 1.75 0 0 1 0 11.25Zm1.75-.25a.25.25 0 0 0-.25.25v9.5c0 .138.112.25.25.25h2a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h6.5a.25.25 0 0 0 .25-.25v-9.5a.25.25 0 0 0-.25-.25Zm7 2.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0ZM9 9a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"></path></svg>',
                        warning: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.397c.65 1.222-.236 2.711-1.621 2.711H1.996C.61 15.155-.276 13.666.375 12.444Zm1.764 1.252a.25.25 0 0 0-.442 0L1.696 13.696a.25.25 0 0 0 .221.359h12.166a.25.25 0 0 0 .221-.359ZM9 11a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm-.25-5.25v2.5a.75.75 0 0 1-1.5 0v-2.5a.75.75 0 0 1 1.5 0Z"></path></svg>',
                        caution: '<svg class="octicon" viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M4.47.22A.749.749 0 0 1 5 0h6c.199 0 .389.079.53.22l4.25 4.25c.141.14.22.331.22.53v6a.749.749 0 0 1-.22.53l-4.25 4.25A.749.749 0 0 1 11 16H5a.749.749 0 0 1-.53-.22L.22 11.53A.749.749 0 0 1 0 11V5c0-.199.079-.389.22-.53Zm.84 1.28L1.5 5.31v5.38l3.81 3.81h5.38l3.81-3.81V5.31L10.69 1.5ZM8 4a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4Zm0 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"></path></svg>'
                    };
                    
                    title.innerHTML = `${icons[type]} ${type.charAt(0).toUpperCase() + type.slice(1)}`;
                    bq.insertBefore(title, bq.firstChild);
                }
            }
        });
    }

    // Resolve relative image URLs (remote base URL or local object URLs)
    function processRelativeImages(container) {
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('http') || src.startsWith('data:') || src.startsWith('blob:')) {
                return;
            }
            let cleanSrc = src;
            if (cleanSrc.startsWith('./')) {
                cleanSrc = cleanSrc.substring(2);
            } else if (cleanSrc.startsWith('/')) {
                cleanSrc = cleanSrc.substring(1);
            }
            if (localAssetMap) {
                const mapped = localAssetMap.get(cleanSrc) || localAssetMap.get(decodeURIComponent(cleanSrc));
                if (mapped) {
                    img.src = mapped;
                    return;
                }
            }
            if (courseBaseUrl) {
                img.src = courseBaseUrl + cleanSrc;
            }
        });
    }

    // Extract layout directive from slide markdown (e.g. <!-- layout: navigation -->)
    function extractLayoutDirective(slideMarkdown, index) {
        const match = slideMarkdown.match(/<!--\s*layout:\s*([a-z0-9_-]+)\s*-->/i);
        if (match) {
            let layout = match[1].toLowerCase();
            if (layout === '3-column') layout = 'three-column';
            if (layout === '2-column') layout = 'two-column';
            if (layout === 'stack') layout = 'stacked';
            return layout;
        }
        if (index === 0) return 'title';
        return 'content';
    }

    // Process Navigation Agenda Slide styling
    function processNavigationLayout(container) {
        const items = container.querySelectorAll('li, p');
        items.forEach(item => {
            const hasBold = item.querySelector('strong, b') || /^(\*\*|__)/.test(item.textContent.trim());
            if (hasBold) {
                item.classList.add('nav-item-active');
            } else {
                item.classList.add('nav-item-inactive');
            }
        });
    }

    // Automatically format slides with bullets on left and graphic on right
    function processSplitLayouts(container) {
        if (container.querySelector('.split-layout, .two-column, .grid-2col, .stacked-media')) {
            return;
        }

        const imgs = container.querySelectorAll('img');
        const lists = container.querySelectorAll('ul, ol');

        if (imgs.length >= 1 && lists.length >= 1) {
            const img = imgs[0];
            const list = lists[0];
            const imgTarget = (img.parentElement && img.parentElement.tagName === 'P') ? img.parentElement : img;

            const splitWrapper = document.createElement('div');
            splitWrapper.className = 'split-layout';

            const leftCol = document.createElement('div');
            leftCol.className = 'split-left';

            const rightCol = document.createElement('div');
            rightCol.className = 'split-right';

            list.parentNode.insertBefore(splitWrapper, list);
            leftCol.appendChild(list);
            rightCol.appendChild(imgTarget);

            splitWrapper.appendChild(leftCol);
            splitWrapper.appendChild(rightCol);
        }
    }

    // Stacked layout: keep title/content on top and pin the image below (no auto-split)
    function processStackedLayout(container) {
        if (container.querySelector('.stacked-media')) {
            return;
        }

        const imgs = container.querySelectorAll('img');
        if (imgs.length === 0) return;

        const img = imgs[0];
        const imgTarget = (img.parentElement && img.parentElement.tagName === 'P') ? img.parentElement : img;

        const media = document.createElement('div');
        media.className = 'stacked-media';
        imgTarget.parentNode.insertBefore(media, imgTarget);
        media.appendChild(imgTarget);
    }

    // Automatically format slides with three columns
    function processThreeColumnLayout(container) {
        if (container.querySelector('.three-column-wrapper')) {
            return;
        }

        // Find header elements that can act as column markers.
        // Look for h3 first, fallback to h2 then h4.
        let headers = Array.from(container.querySelectorAll('h3'));
        if (headers.length === 0) {
            headers = Array.from(container.querySelectorAll('h2'));
        }
        if (headers.length === 0) {
            headers = Array.from(container.querySelectorAll('h4'));
        }

        if (headers.length < 2) return;

        const children = Array.from(container.children);
        const firstHeaderIndex = children.indexOf(headers[0]);
        const insertReference = children[firstHeaderIndex];
        const originalParent = insertReference ? insertReference.parentNode : null;
        
        if (!originalParent) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'three-column-wrapper';

        // Insert wrapper before the first header element's original position
        originalParent.insertBefore(wrapper, insertReference);

        let currentColumn = null;
        for (let i = firstHeaderIndex; i < children.length; i++) {
            const child = children[i];
            
            if (headers.includes(child)) {
                currentColumn = document.createElement('div');
                currentColumn.className = 'column';
                wrapper.appendChild(currentColumn);
            }
            
            if (currentColumn) {
                currentColumn.appendChild(child);
            }
        }
    }

    // Automatically format slides with two custom columns (headers and lists)
    function processTwoColumnLayout(container) {
        if (container.querySelector('.two-column-wrapper')) {
            return;
        }

        // Find header elements that can act as column markers.
        // Look for h3 first, fallback to h2 then h4.
        let headers = Array.from(container.querySelectorAll('h3'));
        if (headers.length === 0) {
            headers = Array.from(container.querySelectorAll('h2'));
        }
        if (headers.length === 0) {
            headers = Array.from(container.querySelectorAll('h4'));
        }

        if (headers.length < 2) return;

        const children = Array.from(container.children);
        const firstHeaderIndex = children.indexOf(headers[0]);
        const insertReference = children[firstHeaderIndex];
        const originalParent = insertReference ? insertReference.parentNode : null;
        
        if (!originalParent) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'two-column-wrapper';

        // Insert wrapper before the first header element's original position
        originalParent.insertBefore(wrapper, insertReference);

        let currentColumn = null;
        for (let i = firstHeaderIndex; i < children.length; i++) {
            const child = children[i];
            
            if (headers.includes(child)) {
                currentColumn = document.createElement('div');
                currentColumn.className = 'column';
                wrapper.appendChild(currentColumn);
            }
            
            if (currentColumn) {
                currentColumn.appendChild(child);
            }
        }
    }

    // Add Code Block Copy Buttons
    function processCodeCopyButtons(container) {
        const preBlocks = container.querySelectorAll('pre');
        preBlocks.forEach(pre => {
            const btn = document.createElement('button');
            btn.className = 'copy-btn';
            btn.textContent = 'Copy';
            
            btn.addEventListener('click', () => {
                const codeElement = pre.querySelector('code');
                const textToCopy = codeElement ? codeElement.textContent : pre.textContent;
                
                navigator.clipboard.writeText(textToCopy).then(() => {
                    btn.textContent = 'Copied!';
                    setTimeout(() => btn.textContent = 'Copy', 2000);
                }).catch(err => {
                    console.error('Error copying text:', err);
                    btn.textContent = 'Error';
                });
            });
            
            pre.appendChild(btn);
        });
    }

    // External Link Handling
    function processExternalLinks(container) {
        const links = container.querySelectorAll('a');
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#')) {
                link.setAttribute('target', '_blank');
                link.setAttribute('rel', 'noopener noreferrer');
            }
        });
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && (e.key === 'o' || e.key === 'O')) {
            e.preventDefault();
            openOpenModal();
            return;
        }

        if (openModalOpen) {
            if (e.key === 'Escape') {
                e.preventDefault();
                closeOpenModal();
            }
            return;
        }

        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
            return;
        }

        switch (e.key) {
            case 'ArrowRight':
            case 'Space':
            case 'PageDown':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
            case 'PageUp':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(slides.length - 1);
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'p':
            case 'P':
                e.preventDefault();
                setAnnotationTool(currentTool === 'pen' ? 'none' : 'pen');
                break;
            case 'h':
            case 'H':
                e.preventDefault();
                setAnnotationTool(currentTool === 'highlighter' ? 'none' : 'highlighter');
                break;
            case 'o':
            case 'O':
                e.preventDefault();
                setAnnotationTool(currentTool === 'pointer' ? 'none' : 'pointer');
                break;
            case 'c':
            case 'C':
                e.preventDefault();
                slideAnnotations[currentIndex] = [];
                saveAnnotationsToStorage();
                clearCanvas();
                clearSlidePointer();
                break;
            case 'Escape':
                // reserved for modal; no-op here
                break;
        }
    });

    // Handle Hash navigation changes
    window.addEventListener('popstate', () => {
        const hash = window.location.hash;
        if (hash) {
            const match = hash.match(/#(?:slide-)?(\d+)/i);
            if (match) {
                const index = parseInt(match[1], 10) - 1;
                if (index !== currentIndex) {
                    goToSlide(index);
                }
            }
        }
    });

    // PDF Export Functionality (Native Print PDF)
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const printStage = document.getElementById('print-stage');

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', prepareAndPrintPdf);
    }

    async function prepareAndPrintPdf() {
        if (!printStage || slides.length === 0) return;

        if (exportPdfBtn) exportPdfBtn.textContent = '⏳';

        // Clear previous print content
        printStage.innerHTML = '';

        // Render each slide sequentially into printStage
        slides.forEach((slideMarkdown, index) => {
            const layoutType = extractLayoutDirective(slideMarkdown, index);
            const html = marked.parse(slideMarkdown);

            const card = document.createElement('div');
            card.className = `slide-card print-slide-card layout-${layoutType}`;

            const topBar = document.createElement('div');
            topBar.className = 'slide-top-bar';

            const body = document.createElement('div');
            body.className = 'slide-body';
            body.innerHTML = html;

            // Apply post-processing
            processGitHubAlerts(body);
            processRelativeImages(body);
            if (layoutType === 'stacked') {
                processStackedLayout(body);
            } else {
                processSplitLayouts(body);
            }
            processCodeCopyButtons(body);
            processExternalLinks(body);

            if (layoutType === 'navigation' || layoutType === 'section') {
                processNavigationLayout(body);
            } else if (layoutType === 'three-column') {
                processThreeColumnLayout(body);
            } else if (layoutType === 'two-column') {
                processTwoColumnLayout(body);
            }

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
                // Prefer intrinsic aspect ratio; print CSS caps size without stretching
                img.style.width = 'auto';
                img.style.height = 'auto';
                img.style.maxWidth = '100%';
                img.style.objectFit = 'contain';
            });

            // Create slide footer
            const footer = document.createElement('footer');
            footer.className = 'roi-slide-footer';
            
            const currentTitle = (footerCourseTitle && footerCourseTitle.textContent) ? footerCourseTitle.textContent : 'ROI Training';
            
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
                <div class="footer-cell footer-number">${index + 1} of ${slides.length}</div>
            `;
            const printCourseEl = footer.querySelector('.footer-course');
            if (printCourseEl) {
                printCourseEl.textContent = currentTitle;
                // Mirror live footer fit size (print-stage is display:none until print)
                if (footerCourseTitle && footerCourseTitle.style.fontSize) {
                    printCourseEl.style.fontSize = footerCourseTitle.style.fontSize;
                }
            }

            card.appendChild(topBar);
            card.appendChild(body);
            card.appendChild(footer);
            printStage.appendChild(card);
        });

        // Load images off-screen (do not use visibility:hidden — that prints blank)
        printStage.classList.add('is-preparing');
        printStage.removeAttribute('style');

        // Wait for all images in printStage to complete loading before invoking window.print()
        const images = Array.from(printStage.querySelectorAll('img'));
        const imagePromises = images.map(img => {
            if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
            return new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        });

        await Promise.all(imagePromises);
        await new Promise(resolve => setTimeout(resolve, 200));

        if (exportPdfBtn) exportPdfBtn.textContent = '🖨️';

        // Leave preparing class on so content stays in DOM; @media print overrides it to on-page
        window.print();
    }

    window.addEventListener('afterprint', () => {
        if (printStage) {
            printStage.innerHTML = '';
            printStage.classList.remove('is-preparing');
            printStage.removeAttribute('style');
        }
    });

    // ==========================================
    // Slide Annotation System (Pen, Highlighter & Pointer)
    // ==========================================
    const canvas = document.getElementById('annotation-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const penBtn = document.getElementById('pen-tool-btn');
    const highlighterBtn = document.getElementById('highlighter-tool-btn');
    const pointerBtn = document.getElementById('pointer-tool-btn');
    const clearBtn = document.getElementById('clear-canvas-btn');
    const slidePointer = document.getElementById('slide-pointer');

    let currentTool = 'none'; // 'none' | 'pen' | 'highlighter' | 'pointer'
    let isDrawing = false;
    let currentStroke = null;

    // Persistent storage of strokes per slide index (keyed by courseUrl via saveAnnotationsToStorage)
    // slideAnnotations is declared in application state and reloaded in applyCourseMarkdown

    function placeSlidePointer(xNorm, yNorm) {
        if (!slidePointer) return;
        slidePointer.hidden = false;
        slidePointer.setAttribute('aria-hidden', 'false');
        slidePointer.style.left = `${xNorm * 100}%`;
        slidePointer.style.top = `${yNorm * 100}%`;
    }

    function clearSlidePointer() {
        if (!slidePointer) return;
        slidePointer.hidden = true;
        slidePointer.setAttribute('aria-hidden', 'true');
    }

    function resizeCanvas() {
        if (!canvas || !slideCard) return;
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
        
        if (ctx) {
            if (ctx.resetTransform) {
                ctx.resetTransform();
            } else {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
            ctx.scale(dpr, dpr);
        }
        redrawCurrentSlideAnnotations();
    }

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', () => {
        setTimeout(resizeCanvas, 50);
        setTimeout(resizeCanvas, 250);
    });
    document.addEventListener('webkitfullscreenchange', () => {
        setTimeout(resizeCanvas, 50);
        setTimeout(resizeCanvas, 250);
    });

    if (window.ResizeObserver && slideCard) {
        const slideObserver = new ResizeObserver(() => {
            resizeCanvas();
        });
        slideObserver.observe(slideCard);
    }

    setTimeout(resizeCanvas, 200);

    if (penBtn) {
        penBtn.addEventListener('click', () => {
            setAnnotationTool(currentTool === 'pen' ? 'none' : 'pen');
        });
    }

    if (highlighterBtn) {
        highlighterBtn.addEventListener('click', () => {
            setAnnotationTool(currentTool === 'highlighter' ? 'none' : 'highlighter');
        });
    }

    if (pointerBtn) {
        pointerBtn.addEventListener('click', () => {
            setAnnotationTool(currentTool === 'pointer' ? 'none' : 'pointer');
        });
    }

    const deleteAllBtn = document.getElementById('delete-all-canvas-btn');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            slideAnnotations[currentIndex] = [];
            saveAnnotationsToStorage();
            clearCanvas();
            clearSlidePointer();
        });
    }

    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            slideAnnotations = {};
            localStorage.removeItem(`slides-annotations-${courseUrl || 'default'}`);
            clearCanvas();
            clearSlidePointer();
        });
    }

    function setAnnotationTool(tool) {
        currentTool = tool;
        if (penBtn) penBtn.classList.toggle('active', tool === 'pen');
        if (highlighterBtn) highlighterBtn.classList.toggle('active', tool === 'highlighter');
        if (pointerBtn) pointerBtn.classList.toggle('active', tool === 'pointer');

        if (canvas) {
            canvas.classList.toggle('active-tool', tool !== 'none');
            canvas.classList.toggle('pointer-mode', tool === 'pointer');
        }

        // Pointer is only visible while the pointer tool is active
        if (tool !== 'pointer') {
            clearSlidePointer();
        }
    }

    function clearCanvas() {
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function getCanvasCoords(e) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        };
    }

    if (canvas) {
        const startDraw = (e) => {
            if (currentTool === 'none' || currentTool === 'pointer') return;
            e.preventDefault();
            const pt = getCanvasCoords(e);

            isDrawing = true;
            currentStroke = {
                tool: currentTool,
                color: currentTool === 'pen' ? '#003865' : '#ffeb3b',
                lineWidth: currentTool === 'pen' ? 3 : 20,
                points: [pt]
            };
        };

        const drawMove = (e) => {
            if (!isDrawing || !currentStroke) return;
            e.preventDefault();
            const pt = getCanvasCoords(e);
            currentStroke.points.push(pt);
            renderStroke(currentStroke);
        };

        const stopDraw = (e) => {
            if (!isDrawing || !currentStroke) return;
            isDrawing = false;
            
            if (!slideAnnotations[currentIndex]) {
                slideAnnotations[currentIndex] = [];
            }
            slideAnnotations[currentIndex].push(currentStroke);
            currentStroke = null;
            saveAnnotationsToStorage();
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', drawMove);
        window.addEventListener('mouseup', stopDraw);

        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', drawMove, { passive: false });
        canvas.addEventListener('touchend', stopDraw);
    }

    // Place/move pointer on slide click without blocking scroll (canvas is pointer-events: none in pointer mode)
    if (slideCard) {
        slideCard.addEventListener('click', (e) => {
            if (currentTool !== 'pointer') return;
            // Ignore clicks on the annotation dock tools if they somehow bubble here
            if (e.target.closest && e.target.closest('.annotation-dock')) return;

            const rect = slideCard.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            placeSlidePointer(x, y);
        });
    }

    function renderStroke(stroke) {
        if (!canvas || !ctx || !stroke.points || stroke.points.length === 0) return;
        const rect = canvas.getBoundingClientRect();

        ctx.save();
        ctx.beginPath();
        
        let strokeColor = stroke.color;
        if (stroke.tool === 'highlighter') {
            strokeColor = '#ffeb3b';
        } else if (stroke.tool === 'pen' && (strokeColor === '#ff3b30' || !strokeColor)) {
            strokeColor = '#003865';
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = stroke.lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = 'source-over';

        const pts = stroke.points;
        ctx.moveTo(pts[0].x * rect.width, pts[0].y * rect.height);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x * rect.width, pts[i].y * rect.height);
        }
        ctx.stroke();
        ctx.restore();
    }

    function redrawCurrentSlideAnnotations() {
        clearCanvas();
        const strokes = slideAnnotations[currentIndex];
        if (strokes && Array.isArray(strokes)) {
            strokes.forEach(stroke => renderStroke(stroke));
        }
    }
});
