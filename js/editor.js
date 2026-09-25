/* Visual editor: local course folder, live preview, Markdown pane, save in place. */
import { state, SLIDE_DESIGN_WIDTH, SLIDE_DESIGN_HEIGHT } from './state.js';
import { renderSlideInto } from './render-slide.js?v=46';
import {
    LAYOUT_OPTIONS,
    NEW_SLIDE_MARKDOWN,
    parseChapter,
    readLayoutId,
    serializeChapter,
    setLayoutLine,
    setSlideImage,
    slideTitle
} from './editor-model.js';
import { loadSlideThemes, resolveThemeName } from './themes.js';

const THEME_KEY = 'slides-viewer-slide-theme';
const MEDIA_DIRS = new Set(['images', 'image', 'img', 'assets']);
const SKIP_DIRS = new Set([
    'node_modules', '.git', '.github', '.agents', '.vscode', 'css', 'js', 'scripts', 'fonts', 'static'
]);
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;
const DRAWER_PIN_KEY = 'slides-editor-drawer-pinned';
const THUMB_BASE_WIDTH = 960;

const els = {};
const doc = {
    courseTitle: '',
    slides: [],
    index: 0,
    chapters: [],
    chapterId: null,
    courseDir: '',
    courseDirHandle: null,
    entries: [],
    savedSnapshot: '',
    images: []
};

let blobUrls = [];
let dragFrom = null;
let unsavedChoice = null;
let canEdit = false;
let drawerPinned = localStorage.getItem(DRAWER_PIN_KEY) === 'true';
let drawerOpen = drawerPinned;

function $(id) {
    return document.getElementById(id);
}

function isMarkdownName(name) {
    return /\.(md|markdown)$/i.test(name || '');
}

function isReadme(name) {
    return /^readme\.(md|markdown)$/i.test(name || '');
}

function parentDir(path) {
    const index = path.lastIndexOf('/');
    return index === -1 ? '' : path.slice(0, index);
}

function chapterLabel(name) {
    return String(name || '')
        .replace(/\.(md|markdown)$/i, '')
        .replace(/[-_]+/g, ' ')
        .trim();
}

function sortNames(names) {
    return [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function pickDefaultChapter(names) {
    const sorted = sortNames(names);
    return sorted.find((name) => /introduction|intro|overview|00[-_]/i.test(name)) || sorted[0] || null;
}

function belongsToCourse(path, courseDir) {
    if (!courseDir) {
        if (!path.includes('/')) return true;
        return MEDIA_DIRS.has(path.split('/')[0].toLowerCase());
    }
    return path === courseDir || path.startsWith(`${courseDir}/`);
}

function relativeToCourse(path, courseDir) {
    if (!courseDir) return path;
    if (path === courseDir) return '';
    return path.slice(courseDir.length + 1);
}

function setStatus(message, isDirty) {
    els.saveStatus.textContent = message || '';
    els.saveStatus.classList.toggle('is-dirty', !!isDirty);
}

function currentSnapshot() {
    return serializeChapter(doc.courseTitle, doc.slides);
}

function isDirty() {
    if (!doc.chapters.length) return false;
    commitPane();
    return currentSnapshot() !== doc.savedSnapshot;
}

function refreshDirty() {
    if (!doc.chapters.length) {
        setStatus('');
        els.saveBtn.disabled = true;
        return;
    }
    const dirty = currentSnapshot() !== doc.savedSnapshot;
    setStatus(dirty ? 'Unsaved changes' : 'Saved', dirty);
    els.saveBtn.disabled = !dirty;
}

function commitPane() {
    if (!doc.slides.length || !els.markdown) return;
    doc.slides[doc.index] = els.markdown.value;
}

function setEditingEnabled(enabled) {
    canEdit = enabled;
    els.courseTitleInput.disabled = !enabled;
    els.layoutSelect.disabled = !enabled;
    els.markdown.disabled = !enabled;
    els.addImageBtn.disabled = !enabled;
    els.imageSelect.disabled = !enabled || doc.images.length === 0;
    els.useImageBtn.disabled = !enabled || !els.imageSelect.value;
}

let availableThemes = ['roi-theme'];

function applyTheme(name, { persist = true } = {}) {
    const theme = resolveThemeName(name, availableThemes);
    document.documentElement.setAttribute('data-theme', theme);
    if (els.themeSelect && els.themeSelect.querySelector(`option[value="${theme}"]`)) {
        els.themeSelect.value = theme;
    }
    if (persist) localStorage.setItem(THEME_KEY, theme);
}

function scaleSlideToFit() {
    if (!els.stage || !els.shell || !els.card) return;
    const stageStyle = getComputedStyle(els.stage);
    const padX = (parseFloat(stageStyle.paddingLeft) || 0) + (parseFloat(stageStyle.paddingRight) || 0);
    const padY = (parseFloat(stageStyle.paddingTop) || 0) + (parseFloat(stageStyle.paddingBottom) || 0);
    const availW = Math.max(0, els.stage.clientWidth - padX);
    const availH = Math.max(0, els.stage.clientHeight - padY);
    if (availW < 2 || availH < 2) return;
    const scale = Math.min(availW / SLIDE_DESIGN_WIDTH, availH / SLIDE_DESIGN_HEIGHT);
    els.shell.style.width = `${SLIDE_DESIGN_WIDTH * scale}px`;
    els.shell.style.height = `${SLIDE_DESIGN_HEIGHT * scale}px`;
    els.card.style.transform = `scale(${scale})`;
}

function renderPreview() {
    if (!doc.slides.length) return;
    const markdown = doc.slides[doc.index];
    renderSlideInto(els.card, els.slideBody, markdown, doc.index);
    els.footerTitle.textContent = doc.courseTitle || 'ROI Training';
    els.footerNumber.textContent = `${doc.index + 1} of ${doc.slides.length}`;
    els.toolbarTitle.textContent = doc.courseTitle || 'Slide Editor';
    scaleSlideToFit();
}

function scaleThumbViewport(viewport) {
    const canvas = viewport.querySelector('.slide-thumb-canvas');
    if (!canvas) return;
    const width = viewport.clientWidth;
    if (!width) return;
    canvas.style.transform = `scale(${width / THUMB_BASE_WIDTH})`;
}

function scaleAllThumbs() {
    requestAnimationFrame(() => {
        els.slideList.querySelectorAll('.slide-thumb-viewport').forEach(scaleThumbViewport);
    });
}

function renderThumb(index, button) {
    const canvas = button.querySelector('.slide-thumb-canvas');
    const body = canvas && canvas.querySelector('.slide-body');
    if (!body) return;
    renderSlideInto(canvas, body, doc.slides[index], index, { copyButtons: false });
    const viewport = button.querySelector('.slide-thumb-viewport');
    if (viewport) scaleThumbViewport(viewport);
}

function syncDrawer() {
    document.body.classList.toggle('drawer-pinned', drawerPinned && drawerOpen);
    els.sideMenu.classList.toggle('open', drawerOpen);
    if (els.pinBtn) {
        els.pinBtn.setAttribute('aria-pressed', drawerPinned ? 'true' : 'false');
        els.pinBtn.title = drawerPinned ? 'Unpin slide list' : 'Pin slide list open';
        els.pinBtn.setAttribute('aria-label', drawerPinned ? 'Unpin slide list' : 'Pin slide list open');
    }
    localStorage.setItem(DRAWER_PIN_KEY, drawerPinned ? 'true' : 'false');
    setTimeout(scaleAllThumbs, 50);
    setTimeout(scaleAllThumbs, 320);
    setTimeout(scaleSlideToFit, 50);
    setTimeout(scaleSlideToFit, 320);
}

function openDrawer() {
    drawerOpen = true;
    syncDrawer();
}

function closeDrawer() {
    drawerOpen = false;
    drawerPinned = false;
    syncDrawer();
}

function toggleDrawer() {
    if (drawerOpen) closeDrawer();
    else openDrawer();
}

function openContextMenu(x, y) {
    if (!canEdit || !els.contextMenu) return;
    els.contextMenu.hidden = false;
    const rect = els.contextMenu.getBoundingClientRect();
    const left = Math.min(x, window.innerWidth - rect.width - 8);
    const top = Math.min(y, window.innerHeight - rect.height - 8);
    els.contextMenu.style.left = `${Math.max(8, left)}px`;
    els.contextMenu.style.top = `${Math.max(8, top)}px`;
}

function closeContextMenu() {
    if (els.contextMenu) els.contextMenu.hidden = true;
}

function buildTray() {
    els.slideList.innerHTML = '';
    doc.slides.forEach((markdown, index) => {
        const li = document.createElement('li');
        li.draggable = true;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'editor-slide-btn';
        button.dataset.index = String(index);
        if (index === doc.index) button.classList.add('active');

        const thumb = document.createElement('div');
        thumb.className = 'slide-thumb';
        thumb.setAttribute('aria-hidden', 'true');
        const viewport = document.createElement('div');
        viewport.className = 'slide-thumb-viewport';
        const canvas = document.createElement('div');
        canvas.className = 'slide-thumb-canvas slide-card';
        canvas.innerHTML = '<div class="slide-top-bar"></div><div class="slide-body"></div>';
        viewport.appendChild(canvas);
        thumb.appendChild(viewport);

        const label = document.createElement('span');
        label.className = 'slide-nav-label';
        label.textContent = `${index + 1}. ${slideTitle(markdown, index)}`;

        button.appendChild(thumb);
        button.appendChild(label);
        button.addEventListener('click', () => selectSlide(index));
        button.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (index !== doc.index) selectSlide(index);
            openContextMenu(event.clientX, event.clientY);
        });
        li.addEventListener('dragstart', () => {
            dragFrom = index;
        });
        li.addEventListener('dragover', (event) => {
            event.preventDefault();
            li.classList.add('is-drop-target');
        });
        li.addEventListener('dragleave', () => li.classList.remove('is-drop-target'));
        li.addEventListener('drop', (event) => {
            event.preventDefault();
            li.classList.remove('is-drop-target');
            reorderSlides(dragFrom, index);
            dragFrom = null;
        });
        li.appendChild(button);
        els.slideList.appendChild(li);
        renderThumb(index, button);
    });
    const active = els.slideList.querySelector('.editor-slide-btn.active');
    if (active) active.scrollIntoView({ block: 'nearest' });
    scaleAllThumbs();
}

function updateActiveLabel() {
    const button = els.slideList.querySelector(`button[data-index="${doc.index}"]`);
    if (!button) return;
    const label = button.querySelector('.slide-nav-label');
    if (label) label.textContent = `${doc.index + 1}. ${slideTitle(doc.slides[doc.index], doc.index)}`;
    renderThumb(doc.index, button);
}

function showSlide() {
    if (!doc.slides.length) return;
    const markdown = doc.slides[doc.index];
    els.markdown.value = markdown;
    els.layoutSelect.value = readLayoutId(markdown, doc.index);
    els.courseTitleInput.value = doc.courseTitle;
    buildTray();
    renderPreview();
    refreshDirty();
}

function selectSlide(index) {
    if (index === doc.index) return;
    commitPane();
    doc.index = index;
    showSlide();
}

function reorderSlides(from, to) {
    if (from === null || from === to || from < 0 || to < 0) return;
    commitPane();
    const [moved] = doc.slides.splice(from, 1);
    doc.slides.splice(to, 0, moved);
    doc.index = to;
    showSlide();
}

function fillLayoutSelect() {
    els.layoutSelect.innerHTML = '';
    LAYOUT_OPTIONS.forEach((option) => {
        const el = document.createElement('option');
        el.value = option.id;
        el.textContent = option.label;
        els.layoutSelect.appendChild(el);
    });
}

function fillImageSelect() {
    const previous = els.imageSelect.value;
    els.imageSelect.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = doc.images.length ? 'Choose an image…' : 'No images in this course';
    els.imageSelect.appendChild(placeholder);
    doc.images.forEach((rel) => {
        const option = document.createElement('option');
        option.value = rel;
        option.textContent = rel;
        els.imageSelect.appendChild(option);
    });
    if (previous && doc.images.includes(previous)) els.imageSelect.value = previous;
    els.imageSelect.disabled = doc.images.length === 0;
    els.useImageBtn.disabled = !els.imageSelect.value;
}

function fillChapterSelect() {
    els.chapterSelect.innerHTML = '';
    if (doc.chapters.length <= 1) {
        els.chapterWrap.hidden = true;
        return;
    }
    doc.chapters.forEach((chapter) => {
        const option = document.createElement('option');
        option.value = chapter.id;
        option.textContent = chapter.label;
        if (chapter.id === doc.chapterId) option.selected = true;
        els.chapterSelect.appendChild(option);
    });
    els.chapterWrap.hidden = false;
}

function revokeBlobs() {
    blobUrls.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch (_) { /* ignore */ }
    });
    blobUrls = [];
    state.localAssetMap = null;
}

function rememberBlob(rel, file) {
    const url = URL.createObjectURL(file);
    blobUrls.push(url);
    if (!state.localAssetMap) state.localAssetMap = new Map();
    state.localAssetMap.set(rel, url);
    if (IMAGE_EXT.test(rel) && !doc.images.includes(rel)) {
        doc.images.push(rel);
        doc.images.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    }
}

async function loadAssets(entries, courseDir) {
    revokeBlobs();
    const map = new Map();
    const images = [];
    for (const entry of entries) {
        if (!belongsToCourse(entry.path, courseDir)) continue;
        if (isMarkdownName(entry.name)) continue;
        const rel = relativeToCourse(entry.path, courseDir);
        if (!rel) continue;
        const file = await entry.handle.getFile();
        const url = URL.createObjectURL(file);
        blobUrls.push(url);
        map.set(rel, url);
        if (IMAGE_EXT.test(rel)) images.push(rel);
    }
    state.localAssetMap = map;
    state.courseBaseUrl = '';
    doc.images = images.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
    fillImageSelect();
}

async function collectEntries(rootHandle) {
    const entries = [];
    async function walk(handle, prefix) {
        for await (const entry of handle.values()) {
            const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
            if (entry.kind === 'file') {
                entries.push({ handle: entry, path: rel, name: entry.name });
            } else if (entry.kind === 'directory') {
                if (SKIP_DIRS.has(entry.name.toLowerCase())) continue;
                await walk(entry, rel);
            }
        }
    }
    await walk(rootHandle, '');
    return entries;
}

async function directoryHandleFor(rootHandle, dir) {
    if (!dir) return rootHandle;
    let current = rootHandle;
    for (const part of dir.split('/')) {
        current = await current.getDirectoryHandle(part);
    }
    return current;
}

function coursesFromEntries(entries, rootName) {
    const byDir = new Map();
    entries.forEach((entry) => {
        if (!isMarkdownName(entry.name) || isReadme(entry.name)) return;
        const dir = parentDir(entry.path);
        if (!byDir.has(dir)) byDir.set(dir, []);
        byDir.get(dir).push(entry);
    });
    return [...byDir.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
        .map(([dir, mdFiles]) => ({
            dir,
            label: dir ? dir.split('/').filter(Boolean).pop() : (rootName || 'This folder'),
            mdFiles
        }));
}

function showCoursePicker(courses) {
    els.coursePicker.hidden = false;
    els.coursePicker.innerHTML = '';
    const message = document.createElement('p');
    message.textContent = 'This folder has more than one course. Choose one.';
    els.coursePicker.appendChild(message);
    courses.forEach((course) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-primary';
        button.textContent = `${course.label} (${course.mdFiles.length} file${course.mdFiles.length === 1 ? '' : 's'})`;
        button.addEventListener('click', () => {
            openCourse(course).catch((err) => setStatus(err.message || String(err), true));
        });
        els.coursePicker.appendChild(button);
    });
    els.shell.hidden = true;
}

async function loadChapter(chapterId) {
    const chapter = doc.chapters.find((item) => item.id === chapterId);
    if (!chapter) return;
    const file = await chapter.handle.getFile();
    const parsed = parseChapter(await file.text());
    doc.courseTitle = parsed.courseTitle;
    doc.slides = parsed.slides.length ? parsed.slides : [NEW_SLIDE_MARKDOWN];
    doc.index = 0;
    doc.chapterId = chapter.id;
    doc.savedSnapshot = serializeChapter(doc.courseTitle, doc.slides);
    els.courseTitleInput.value = doc.courseTitle;
    fillChapterSelect();
    showSlide();
}

async function openCourse(course) {
    els.coursePicker.hidden = true;
    els.shell.hidden = false;
    doc.courseDir = course.dir;
    doc.courseDirHandle = await directoryHandleFor(doc.rootHandle, course.dir);
    const names = sortNames(course.mdFiles.map((file) => file.name));
    doc.chapters = names.map((name) => {
        const entry = course.mdFiles.find((file) => file.name === name && parentDir(file.path) === course.dir);
        return {
            id: name,
            label: chapterLabel(name),
            handle: entry.handle
        };
    });
    await loadAssets(doc.entries, course.dir);
    const defaultName = pickDefaultChapter(names);
    await loadChapter(defaultName);
    setEditingEnabled(true);
    setStatus('Saved');
}

async function openFolder() {
    if (!window.showDirectoryPicker) {
        setStatus('Open folder needs Chrome or Edge.', true);
        return;
    }
    if (doc.chapters.length && isDirty()) {
        const choice = await askUnsaved();
        if (choice === 'cancel') return;
        if (choice === 'save') {
            const saved = await saveChapter();
            if (!saved) return;
        }
    }
    let rootHandle;
    try {
        rootHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    } catch (err) {
        if (err && err.name === 'AbortError') return;
        setStatus(err.message || String(err), true);
        return;
    }
    setStatus('Reading folder…');
    doc.rootHandle = rootHandle;
    doc.entries = await collectEntries(rootHandle);
    const courses = coursesFromEntries(doc.entries, rootHandle.name);
    if (!courses.length) {
        setStatus('No Markdown course files in that folder.', true);
        return;
    }
    if (courses.length === 1) {
        await openCourse(courses[0]);
        return;
    }
    setEditingEnabled(false);
    showCoursePicker(courses);
    setStatus('Choose a course.');
}

async function saveChapter() {
    const chapter = doc.chapters.find((item) => item.id === doc.chapterId);
    if (!chapter) return false;
    commitPane();
    const text = currentSnapshot();
    try {
        const writable = await chapter.handle.createWritable();
        await writable.write(text);
        await writable.close();
    } catch (err) {
        setStatus(err.message || 'Could not save the chapter.', true);
        return false;
    }
    doc.savedSnapshot = text;
    refreshDirty();
    return true;
}

function applyMarkdown(next) {
    doc.slides[doc.index] = next;
    if (els.markdown.value !== next) els.markdown.value = next;
    els.layoutSelect.value = readLayoutId(next, doc.index);
    updateActiveLabel();
    renderPreview();
    refreshDirty();
}

function onLayoutChange() {
    commitPane();
    const next = setLayoutLine(doc.slides[doc.index], els.layoutSelect.value, doc.index);
    applyMarkdown(next);
}

function onPaneInput() {
    doc.slides[doc.index] = els.markdown.value;
    const layoutId = readLayoutId(els.markdown.value, doc.index);
    if (els.layoutSelect.value !== layoutId) els.layoutSelect.value = layoutId;
    updateActiveLabel();
    renderPreview();
    refreshDirty();
}

function addSlide() {
    commitPane();
    doc.slides.splice(doc.index + 1, 0, NEW_SLIDE_MARKDOWN);
    doc.index += 1;
    showSlide();
}

function duplicateSlide() {
    commitPane();
    doc.slides.splice(doc.index + 1, 0, doc.slides[doc.index]);
    doc.index += 1;
    showSlide();
}

function deleteSlide() {
    if (doc.slides.length <= 1) {
        setStatus('A chapter needs at least one slide.', true);
        return;
    }
    if (!window.confirm('Delete this slide?')) return;
    doc.slides.splice(doc.index, 1);
    doc.index = Math.min(doc.index, doc.slides.length - 1);
    showSlide();
}

async function uniqueImageName(dirHandle, filename) {
    const dot = filename.lastIndexOf('.');
    const base = dot > 0 ? filename.slice(0, dot) : filename;
    const ext = dot > 0 ? filename.slice(dot) : '';
    let name = filename;
    let n = 1;
    while (n < 1000) {
        try {
            await dirHandle.getFileHandle(name);
            name = `${base}-${n}${ext}`;
            n += 1;
        } catch (_) {
            return name;
        }
    }
    return `${base}-${Date.now()}${ext}`;
}

async function addImage() {
    if (!doc.courseDirHandle || !window.showOpenFilePicker) {
        setStatus('Adding an image needs Chrome or Edge.', true);
        return;
    }
    let fileHandle;
    try {
        [fileHandle] = await window.showOpenFilePicker({
            multiple: false,
            types: [{
                description: 'Images',
                accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'] }
            }]
        });
    } catch (err) {
        if (err && err.name === 'AbortError') return;
        setStatus(err.message || String(err), true);
        return;
    }
    const file = await fileHandle.getFile();
    const imagesDir = await doc.courseDirHandle.getDirectoryHandle('images', { create: true });
    const name = await uniqueImageName(imagesDir, file.name);
    const dest = await imagesDir.getFileHandle(name, { create: true });
    const writable = await dest.createWritable();
    await writable.write(file);
    await writable.close();
    const rel = `images/${name}`;
    rememberBlob(rel, file);
    fillImageSelect();
    els.imageSelect.value = rel;
    els.useImageBtn.disabled = false;
    commitPane();
    applyMarkdown(setSlideImage(doc.slides[doc.index], rel));
    setStatus('Image added. Save the chapter to keep the Markdown change.', true);
}

function useSelectedImage() {
    const rel = els.imageSelect.value;
    if (!rel) return;
    commitPane();
    applyMarkdown(setSlideImage(doc.slides[doc.index], rel));
}

function askUnsaved() {
    els.unsavedDialog.hidden = false;
    return new Promise((resolve) => {
        unsavedChoice = resolve;
    });
}

function closeUnsaved(choice) {
    els.unsavedDialog.hidden = true;
    const resolve = unsavedChoice;
    unsavedChoice = null;
    if (resolve) resolve(choice);
}

async function changeChapter(nextId) {
    if (!nextId || nextId === doc.chapterId) return;
    if (isDirty()) {
        const choice = await askUnsaved();
        if (choice === 'cancel') {
            els.chapterSelect.value = doc.chapterId;
            return;
        }
        if (choice === 'save') {
            const saved = await saveChapter();
            if (!saved) {
                els.chapterSelect.value = doc.chapterId;
                return;
            }
        }
    }
    await loadChapter(nextId);
}

function bind() {
    els.toolbarTitle = $('course-title-label');
    els.chapterWrap = $('chapter-select-wrap');
    els.chapterSelect = $('chapter-select');
    els.openFolderBtn = $('open-folder-btn');
    els.saveBtn = $('save-btn');
    els.saveStatus = $('save-status');
    els.themeSelect = $('slide-theme-select');
    els.slideList = $('slide-list');
    els.sideMenu = $('side-menu');
    els.menuToggle = $('menu-toggle');
    els.pinBtn = $('pin-menu');
    els.closeMenu = $('close-menu');
    els.contextMenu = $('slide-context-menu');
    els.stage = $('presentation-stage');
    els.shell = $('slide-scale-shell');
    els.card = $('slide-card');
    els.slideBody = $('slide-body');
    els.footerTitle = $('footer-course-title');
    els.footerNumber = $('footer-slide-number');
    els.coursePicker = $('course-picker');
    els.courseTitleInput = $('course-title-input');
    els.layoutSelect = $('layout-select');
    els.imageSelect = $('image-select');
    els.useImageBtn = $('use-image-btn');
    els.addImageBtn = $('add-image-btn');
    els.markdown = $('slide-markdown');
    els.unsavedDialog = $('unsaved-dialog');

    fillLayoutSelect();
    const savedTheme = localStorage.getItem(THEME_KEY);
    loadSlideThemes(els.themeSelect).then((ids) => {
        if (ids.length) availableThemes = ids;
        applyTheme(savedTheme || document.documentElement.getAttribute('data-theme'), { persist: false });
    }).catch((err) => {
        console.error(err);
        applyTheme(savedTheme || document.documentElement.getAttribute('data-theme'), { persist: false });
    });

    els.themeSelect.addEventListener('change', () => applyTheme(els.themeSelect.value));
    els.openFolderBtn.addEventListener('click', () => {
        openFolder().catch((err) => setStatus(err.message || String(err), true));
    });
    els.saveBtn.addEventListener('click', () => {
        saveChapter().catch((err) => setStatus(err.message || String(err), true));
    });
    els.chapterSelect.addEventListener('change', () => {
        changeChapter(els.chapterSelect.value).catch((err) => setStatus(err.message || String(err), true));
    });
    els.courseTitleInput.addEventListener('input', () => {
        doc.courseTitle = els.courseTitleInput.value;
        renderPreview();
        refreshDirty();
    });
    els.layoutSelect.addEventListener('change', onLayoutChange);
    els.markdown.addEventListener('input', onPaneInput);
    els.menuToggle.addEventListener('click', toggleDrawer);
    els.pinBtn.addEventListener('click', () => {
        drawerPinned = !drawerPinned;
        if (drawerPinned) drawerOpen = true;
        syncDrawer();
    });
    els.closeMenu.addEventListener('click', closeDrawer);
    els.sideMenu.addEventListener('contextmenu', (event) => {
        if (event.target.closest('.editor-slide-btn')) return;
        if (!canEdit) return;
        event.preventDefault();
        openContextMenu(event.clientX, event.clientY);
    });
    els.stage.addEventListener('contextmenu', (event) => {
        if (!canEdit) return;
        event.preventDefault();
        openContextMenu(event.clientX, event.clientY);
    });
    els.contextMenu.addEventListener('click', (event) => {
        const action = event.target && event.target.dataset && event.target.dataset.action;
        closeContextMenu();
        if (action === 'add') addSlide();
        else if (action === 'duplicate') duplicateSlide();
        else if (action === 'delete') deleteSlide();
    });
    document.addEventListener('mousedown', (event) => {
        if (!els.contextMenu || els.contextMenu.hidden) return;
        if (els.contextMenu.contains(event.target)) return;
        closeContextMenu();
    });
    window.addEventListener('resize', () => {
        closeContextMenu();
        scaleAllThumbs();
    });
    if (typeof ResizeObserver !== 'undefined') {
        const thumbObserver = new ResizeObserver(() => {
            if (drawerOpen) scaleAllThumbs();
        });
        thumbObserver.observe(els.sideMenu);
    }
    els.useImageBtn.addEventListener('click', useSelectedImage);
    els.addImageBtn.addEventListener('click', () => {
        addImage().catch((err) => setStatus(err.message || String(err), true));
    });
    els.imageSelect.addEventListener('change', () => {
        els.useImageBtn.disabled = !els.imageSelect.value;
    });
    $('unsaved-save').addEventListener('click', () => closeUnsaved('save'));
    $('unsaved-discard').addEventListener('click', () => closeUnsaved('discard'));
    $('unsaved-cancel').addEventListener('click', () => closeUnsaved('cancel'));

    window.addEventListener('resize', scaleSlideToFit);
    window.addEventListener('beforeunload', (event) => {
        if (!doc.chapters.length) return;
        commitPane();
        if (currentSnapshot() === doc.savedSnapshot) return;
        event.preventDefault();
        event.returnValue = '';
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeContextMenu();
            return;
        }
        if ((event.metaKey || event.ctrlKey) && (event.key === 's' || event.key === 'S')) {
            event.preventDefault();
            if (!els.saveBtn.disabled) {
                saveChapter().catch((err) => setStatus(err.message || String(err), true));
            }
            return;
        }
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement && document.activeElement.tagName)) {
            return;
        }
        if (!doc.slides.length) return;
        if (event.key === 'ArrowRight' || event.key === 'PageDown') {
            event.preventDefault();
            if (doc.index < doc.slides.length - 1) selectSlide(doc.index + 1);
        } else if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
            event.preventDefault();
            if (doc.index > 0) selectSlide(doc.index - 1);
        }
    });

    syncDrawer();
    scaleSlideToFit();
}

if (window.marked && window.hljs) {
    window.marked.setOptions({
        highlight: function (code, lang) {
            const language = window.hljs.getLanguage(lang) ? lang : 'plaintext';
            return window.hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
} else {
    bind();
}
