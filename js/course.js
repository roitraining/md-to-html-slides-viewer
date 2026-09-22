/* Feature module */
import { state, els, api, SLIDE_DESIGN_WIDTH, SLIDE_DESIGN_HEIGHT, SLIDE_DESIGN_FONT_PX } from './state.js';

export function initCourse() {
    // ─── Course loading ───────────────────────────────────────────────
    const IGNORED_DIR_NAMES = new Set([
        'images', 'image', 'img', 'assets', 'static', 'css', 'js', 'scripts',
        'node_modules', '.git', '.github', '.agents', '.vscode', 'fonts'
    ]);
    const RECENT_GITHUB_KEY = 'slides-viewer-recent-github';
    function revokeLocalAssets() {
        if (state.localAssetMap) {
            state.localAssetMap.forEach((url) => {
                try { URL.revokeObjectURL(url); } catch (_) { /* ignore */ }
            });
        }
        state.localAssetMap = null;
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
        if (!els.openCourseStatus) return;
        els.openCourseStatus.textContent = message || '';
        els.openCourseStatus.classList.toggle('is-error', !!isError);
    }

    function notifyNoCourseAtPath(pathLabel) {
        const where = pathLabel ? `\n\n${pathLabel}` : '';
        const message =
            `No course found at that path.${where}\n\n` +
            'A course folder must contain Markdown course files (and usually an images/ folder).';
        window.alert(message);
        setOpenStatus('No course found at that path.', true);
    }

    function isNoCourseError(err) {
        const msg = (err && err.message) || String(err || '');
        return /no markdown course|no course found|no markdown \(\.md\) files found/i.test(msg);
    }

    function clearOpenBrowser() {
        if (!els.openCourseBrowser) return;
        els.openCourseBrowser.hidden = true;
        els.openCourseBrowser.innerHTML = '';
    }

    function renderBrowserList(heading, items) {
        if (!els.openCourseBrowser) return;
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

        els.openCourseBrowser.appendChild(headingEl);
        els.openCourseBrowser.appendChild(ul);
        els.openCourseBrowser.hidden = false;
    }

    function syncShareLinkButton() {
        if (!els.copyShareLinkBtn) return;
        els.copyShareLinkBtn.hidden = !state.currentShareUrl;
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
        state.slideAnnotations = {};
        const key = `slides-annotations-${state.courseUrl || 'default'}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                state.slideAnnotations = JSON.parse(saved);
            } catch (_) {
                state.slideAnnotations = {};
            }
        }
        api.clearCanvas?.();
        api.clearSlidePointer?.();
    }

    function saveAnnotationsToStorage() {
        const key = `slides-annotations-${state.courseUrl || 'default'}`;
        localStorage.setItem(key, JSON.stringify(state.slideAnnotations));
    }

    function updateChapterSelector() {
        if (!els.chapterSelect || !els.chapterSelectWrap) return;
        els.chapterSelect.innerHTML = '';

        if (!state.courseChapters || state.courseChapters.length <= 1) {
            els.chapterSelectWrap.hidden = true;
            return;
        }

        state.courseChapters.forEach((ch) => {
            const opt = document.createElement('option');
            opt.value = ch.id;
            opt.textContent = ch.label;
            if (ch.id === state.currentChapterId) opt.selected = true;
            els.chapterSelect.appendChild(opt);
        });
        els.chapterSelectWrap.hidden = false;
    }

    function applyCourseMarkdown(markdownText, options = {}) {
        const {
            sourceKey,
            baseUrl = '',
            assetMap = null,
            shareUrl = null,
            chapters = null,
            chapterId = null,
            respectHash = true
        } = options;

        revokeLocalAssets();
        state.localAssetMap = assetMap;
        state.courseUrl = sourceKey || 'course';
        state.courseBaseUrl = baseUrl || '';
        state.currentShareUrl = shareUrl || null;

        if (chapters) {
            state.courseChapters = chapters;
            state.currentChapterId = chapterId || (chapters[0] && chapters[0].id) || null;
        }

        state.slides = markdownText
            .split(/\r?\n---\r?\n/)
            .map((slide) => slide.trim())
            .filter((slide) => slide.length > 0);

        if (state.slides.length === 0) {
            els.slideBody.innerHTML = '<div class="error">No slides found in the specified Markdown file.</div>';
            updateChapterSelector();
            syncShareLinkButton();
            return;
        }

        const commentMatch = markdownText.match(
            /<!--\s*(?:course-title|course_title|course|footer-title|footer_title):\s*(.*?)\s*-->/i
        );
        const customCourseTitle = commentMatch ? commentMatch[1].trim() : '';

        if (customCourseTitle) {
            if (els.footerCourseTitle) els.footerCourseTitle.textContent = customCourseTitle;
            if (els.courseTitle) els.courseTitle.textContent = customCourseTitle;
            requestAnimationFrame(() => api.fitFooterCourseTitle?.());
        }

        reloadAnnotationsForCourse();
        api.buildSlideDrawer(customCourseTitle);
        updateChapterSelector();
        syncShareLinkButton();
        updateBrowserCourseQuery(state.currentShareUrl);

        // Chapter switches start at slide 1; deep links / refresh still honor #slide-N.
        let initialIndex = 0;
        if (respectHash) {
            const hash = window.location.hash;
            if (hash) {
                const match = hash.match(/#(?:slide-)?(\d+)/i);
                if (match) {
                    initialIndex = parseInt(match[1], 10) - 1;
                }
            }
        }
        api.goToSlide(initialIndex);
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
                if (els.githubUrlInput) els.githubUrlInput.value = url;
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
            chapters: chapterState ? chapterState.chapters : state.courseChapters,
            chapterId: chapterState ? chapterState.chapterId : state.currentChapterId,
            respectHash: chapterState ? chapterState.respectHash !== false : true
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
        state.courseChapters = chapters;
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
        state.currentChapterId = chapter.id;
        await loadRemoteMarkdown(chapter.rawUrl, chapter.shareUrl, {
            chapters: state.courseChapters,
            chapterId: chapter.id,
            respectHash: false
        });
        updateChapterSelector();
    }

    async function inspectGitHubDirectory(owner, repo, ref, dirPath, options = {}) {
        const { alertIfNoCourse = false } = options;
        const pathLabel = dirPath
            ? `${owner}/${repo}/${dirPath}`
            : `${owner}/${repo}`;

        setOpenStatus(`Looking in ${dirPath || 'repository root'}…`);
        const listing = await listGitHubContents(owner, repo, dirPath, ref);
        if (!Array.isArray(listing)) {
            if (listing && listing.type === 'file' && isMarkdownName(listing.name)) {
                const shareUrl = githubBlobUrl(owner, repo, ref, listing.path || listing.name);
                const rawUrl = listing.download_url || githubRawUrl(owner, repo, ref, listing.path || listing.name);
                state.courseChapters = [];
                state.currentChapterId = null;
                rememberGitHubUrl(shareUrl);
                await loadRemoteMarkdown(rawUrl, shareUrl, { chapters: [], chapterId: null });
                return;
            }
            throw new Error('No course found at that path.');
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
                                state.courseChapters = [];
                                state.currentChapterId = null;
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

        // No Markdown course files at this path
        if (dirs.length === 0) {
            throw new Error('No course found at that path.');
        }

        if (alertIfNoCourse) {
            notifyNoCourseAtPath(pathLabel);
        }

        setOpenStatus(
            `No course in this folder. Pick a course subfolder (${dirs.length} found).`
        );
        rememberGitHubUrl(githubTreeUrl(owner, repo, ref, dirPath));
        renderBrowserList(
            'Course folders',
            dirs.map((dir) => ({
                title: dir.name,
                meta: 'Open folder',
                onSelect: async () => {
                    try {
                        const nextPath = dirPath
                            ? `${dirPath.replace(/\/+$/, '')}/${dir.name}`
                            : dir.name;
                        // Nested picks: list or load without another alert unless truly empty
                        await inspectGitHubDirectory(owner, repo, ref, nextPath, {
                            alertIfNoCourse: false
                        });
                    } catch (err) {
                        console.error(err);
                        const label = dirPath
                            ? `${owner}/${repo}/${dirPath}/${dir.name}`
                            : `${owner}/${repo}/${dir.name}`;
                        if (isNoCourseError(err) || (err && err.status === 404)) {
                            notifyNoCourseAtPath(label);
                        } else {
                            setOpenStatus(err.message || String(err), true);
                        }
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

        const pathLabel = parsed.path
            ? `${parsed.owner}/${parsed.repo}/${parsed.path}`
            : `${parsed.owner}/${parsed.repo}`;

        try {
            const ref = await resolveGitHubRef(parsed.owner, parsed.repo, parsed.ref);
            if (parsed.isFile && parsed.path) {
                if (!isMarkdownName(parsed.path)) {
                    notifyNoCourseAtPath(pathLabel);
                    return;
                }
                setOpenStatus('Loading Markdown file…');
                const rawUrl = githubRawUrl(parsed.owner, parsed.repo, ref, parsed.path);
                const shareUrl = githubBlobUrl(parsed.owner, parsed.repo, ref, parsed.path);
                state.courseChapters = [];
                state.currentChapterId = null;
                rememberGitHubUrl(shareUrl);
                await loadRemoteMarkdown(rawUrl, shareUrl, { chapters: [], chapterId: null });
                return;
            }
            await inspectGitHubDirectory(parsed.owner, parsed.repo, ref, parsed.path || '', {
                alertIfNoCourse: true
            });
        } catch (err) {
            console.error(err);
            if (isNoCourseError(err) || (err && err.status === 404)) {
                notifyNoCourseAtPath(pathLabel);
                return;
            }
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
        state.currentChapterId = chapter.id;
        applyCourseMarkdown(text, {
            sourceKey: `local:${courseDir || ''}/${chapter.id}`,
            baseUrl: '',
            assetMap,
            shareUrl: null,
            chapters,
            chapterId: chapter.id,
            respectHash: false
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

        state.courseChapters = chapters;
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

    // ─── Open modal UI ────────────────────────────────────────────────
    function openOpenModal(tab = null) {
        if (!els.openCourseModal) return;
        els.openCourseModal.hidden = false;
        els.openCourseModal.setAttribute('aria-hidden', 'false');
        state.openModalOpen = true;
        setOpenStatus('');
        syncShareLinkButton();
        renderGitHubRecents();
        if (tab) switchOpenTab(tab);
        const focusEl =
            (tab === 'github' ? els.githubUrlInput : document.getElementById('pick-local-folder')) ||
            document.getElementById('open-course-close');
        if (focusEl && focusEl.focus) setTimeout(() => focusEl.focus(), 0);
    }

    function closeOpenModal() {
        if (!els.openCourseModal) return;
        els.openCourseModal.hidden = true;
        els.openCourseModal.setAttribute('aria-hidden', 'true');
        state.openModalOpen = false;
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
        const pickFolderBtn = document.getElementById('pick-local-folder');
        const folderInput = document.getElementById('local-folder-input');
        const browseBtn = document.getElementById('github-browse-btn');

        if (openBtn) openBtn.addEventListener('click', () => openOpenModal());
        if (closeBtn) closeBtn.addEventListener('click', closeOpenModal);
        if (cancelBtn) cancelBtn.addEventListener('click', closeOpenModal);

        if (els.openCourseModal) {
            els.openCourseModal.addEventListener('click', (e) => {
                if (e.target === els.openCourseModal) closeOpenModal();
            });
        }

        document.querySelectorAll('.modal-tab').forEach((tab) => {
            tab.addEventListener('click', () => switchOpenTab(tab.dataset.tab));
        });

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
                browseGitHubUrl(els.githubUrlInput ? els.githubUrlInput.value : '');
            });
        }
        if (els.githubUrlInput) {
            els.githubUrlInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    browseGitHubUrl(els.githubUrlInput.value);
                }
            });
        }

        if (els.copyShareLinkBtn) {
            els.copyShareLinkBtn.addEventListener('click', async () => {
                if (!state.currentShareUrl) return;
                const sharePage = new URL(window.location.href);
                sharePage.searchParams.set('course', state.currentShareUrl);
                try {
                    await navigator.clipboard.writeText(sharePage.toString());
                    setOpenStatus('Share link copied to clipboard.');
                } catch (_) {
                    setOpenStatus(sharePage.toString());
                }
            });
        }

        if (els.chapterSelect) {
            els.chapterSelect.addEventListener('change', async () => {
                const chapter = state.courseChapters.find((c) => c.id === els.chapterSelect.value);
                if (!chapter) return;
                try {
                    if (chapter.kind === 'github') {
                        await loadGitHubChapter(chapter);
                    } else if (chapter.kind === 'local') {
                        await loadLocalChapter(chapter, chapter.allFiles, chapter.courseDir, state.courseChapters);
                    }
                } catch (err) {
                    console.error(err);
                    els.slideBody.innerHTML = `<div class="error"><strong>Failed to load chapter:</strong><br>${err.message}</div>`;
                } finally {
                    api.focusSlideStage?.();
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
                els.slideBody.innerHTML = `<div class="error">
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
                                state.courseChapters = buildGitHubChapters(gh.owner, gh.repo, ref, dirPath, mdFiles);
                                state.currentChapterId = gh.path.split('/').pop();
                                updateChapterSelector();
                            }
                        }
                    } catch (_) { /* sibling discovery is best-effort */ }
                    return;
                }
                openOpenModal('github');
                if (els.githubUrlInput) els.githubUrlInput.value = paramUrl;
                await inspectGitHubDirectory(gh.owner, gh.repo, ref, gh.path || '', {
                    alertIfNoCourse: true
                });
                return;
            } catch (error) {
                console.error('Error loading course:', error);
                els.slideBody.innerHTML = `<div class="error">
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
            els.slideBody.innerHTML = `<div class="error">
                <strong>Failed to load course slides from URL:</strong><br>
                <code>${paramUrl}</code><br><br>
                <strong>Error:</strong> ${error.message}
            </div>`;
        }
    }

    api.openOpenModal = openOpenModal;
    api.closeOpenModal = closeOpenModal;
    api.bootFromQueryOrDefault = bootFromQueryOrDefault;
    api.applyCourseMarkdown = applyCourseMarkdown;
    api.saveAnnotationsToStorage = saveAnnotationsToStorage;
    api.reloadAnnotationsForCourse = reloadAnnotationsForCourse;
}
