/* Annotation toolbox: pen, highlighter, pointer. */
import { state, els, api, SLIDE_DESIGN_WIDTH, SLIDE_DESIGN_HEIGHT, SLIDE_DESIGN_FONT_PX } from './state.js';

export function initAnnotations() {
    const canvasEl = els.annotationCanvas;
    const ctx = canvasEl ? canvasEl.getContext('2d') : null;
    const flipchartCtx = els.flipchartCanvas ? els.flipchartCanvas.getContext('2d') : null;
    // ==========================================
    // Slide Annotation System (Pen, Highlighter & Pointer)
    // ==========================================
    let currentTool = 'none'; // 'none' | 'pen' | 'highlighter' | 'pointer'
    let isDrawing = false;
    let currentStroke = null;
    let drawSurface = null; // 'slide' | 'flipchart'
    let flipchartOpen = false;
    // Session-only. Not written to storage. Trash clears it.
    let flipchartStrokes = [];
    let penColor = '#4169E1';
    let highlightColor = '#ffe14a';
    const penColors = document.getElementById('pen-colors');
    const highlightColors = document.getElementById('highlight-colors');
    const HIGHLIGHT_ON_PAPER = {
        '#ffeb3b': 'rgba(202, 138, 4, 0.55)',
        '#ffe14a': 'rgba(202, 138, 4, 0.55)',
        '#86efac': 'rgba(22, 163, 74, 0.5)',
        '#7dd3fc': 'rgba(37, 99, 235, 0.5)'
    };

    // Persistent storage of strokes per slide index (keyed by state.courseUrl via saveAnnotationsToStorage)
    // state.slideAnnotations is declared in application state and reloaded in applyCourseMarkdown

    function placeSlidePointer(xNorm, yNorm) {
        if (!els.slidePointer) return;
        els.slidePointer.hidden = false;
        els.slidePointer.setAttribute('aria-hidden', 'false');
        els.slidePointer.style.left = `${xNorm * 100}%`;
        els.slidePointer.style.top = `${yNorm * 100}%`;
    }

    function clearSlidePointer() {
        if (!els.slidePointer) return;
        els.slidePointer.hidden = true;
        els.slidePointer.setAttribute('aria-hidden', 'true');
    }

    function resizeCanvas() {
        if (!els.annotationCanvas || !els.slideCard) return;
        // Use pre-transform layout size (design canvas), not getBoundingClientRect (visual).
        const width = els.annotationCanvas.offsetWidth || SLIDE_DESIGN_WIDTH;
        const height = els.annotationCanvas.offsetHeight || SLIDE_DESIGN_HEIGHT;
        if (width === 0 || height === 0) return;
    
        const dpr = window.devicePixelRatio || 1;
        els.annotationCanvas.width = Math.round(width * dpr);
        els.annotationCanvas.height = Math.round(height * dpr);
    
        if (ctx) {
            if (ctx.resetTransform) {
                ctx.resetTransform();
            } else {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
            }
            ctx.scale(dpr, dpr);
        }
        redrawCurrentSlideAnnotations();
        resizeFlipchartCanvas();
    }

    window.addEventListener('resize', resizeCanvas);
    document.addEventListener('fullscreenchange', () => {
        setTimeout(api.scaleSlideToFit, 50);
        setTimeout(api.scaleSlideToFit, 250);
    });
    document.addEventListener('webkitfullscreenchange', () => {
        setTimeout(api.scaleSlideToFit, 50);
        setTimeout(api.scaleSlideToFit, 250);
    });

    if (window.ResizeObserver && els.presentationStage) {
        const stageObserver = new ResizeObserver(() => {
            api.scaleSlideToFit?.();
        });
        stageObserver.observe(els.presentationStage);
    }

    api.scaleSlideToFit?.();
    setTimeout(api.scaleSlideToFit, 200);

    if (els.penBtn) {
        els.penBtn.addEventListener('click', () => {
            setAnnotationTool(currentTool === 'pen' ? 'none' : 'pen');
        });
    }

    if (els.highlighterBtn) {
        els.highlighterBtn.addEventListener('click', () => {
            setAnnotationTool(currentTool === 'highlighter' ? 'none' : 'highlighter');
        });
    }

    if (els.pointerBtn) {
        els.pointerBtn.addEventListener('click', () => {
            setAnnotationTool(currentTool === 'pointer' ? 'none' : 'pointer');
        });
    }
    if (els.clearBtn) {
        els.clearBtn.addEventListener('click', () => {
            state.slideAnnotations[state.currentIndex] = [];
            api.saveAnnotationsToStorage?.();
            clearCanvas();
            clearSlidePointer();
        });
    }

    if (els.deleteAllBtn) {
        els.deleteAllBtn.addEventListener('click', () => {
            state.slideAnnotations = {};
            localStorage.removeItem(`slides-annotations-${state.courseUrl || 'default'}`);
            clearCanvas();
            clearSlidePointer();
            clearFlipchartDrawing();
        });
    }

    if (els.flipchartBtn) {
        els.flipchartBtn.addEventListener('click', () => {
            if (flipchartOpen) closeFlipchart();
            else openFlipchart();
        });
    }

    if (els.flipchartClose) {
        els.flipchartClose.addEventListener('click', (event) => {
            event.stopPropagation();
            closeFlipchart();
        });
    }

    function setAnnotationTool(tool) {
        currentTool = tool;
        if (els.penBtn) els.penBtn.classList.toggle('active', tool === 'pen');
        if (els.highlighterBtn) els.highlighterBtn.classList.toggle('active', tool === 'highlighter');
        if (els.pointerBtn) els.pointerBtn.classList.toggle('active', tool === 'pointer');

        if (els.annotationCanvas) {
            els.annotationCanvas.classList.toggle('active-tool', tool !== 'none');
            els.annotationCanvas.classList.toggle('pointer-mode', tool === 'pointer');
        }
        if (els.flipchartCanvas) {
            const drawing = tool === 'pen' || tool === 'highlighter';
            els.flipchartCanvas.classList.toggle('drawable', drawing && flipchartOpen);
        }

        // Pointer is only visible while the pointer tool is active
        if (tool !== 'pointer') {
            clearSlidePointer();
        }
        syncColorPickers();
    }

    function markSelectedSwatch(group, color) {
        if (!group) return;
        group.querySelectorAll('.color-swatch').forEach((swatch) => {
            const on = (swatch.dataset.color || '').toLowerCase() === color.toLowerCase();
            swatch.classList.toggle('is-selected', on);
            swatch.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
    }

    function syncColorPickers() {
        if (penColors) penColors.hidden = currentTool !== 'pen';
        if (highlightColors) highlightColors.hidden = currentTool !== 'highlighter';
        markSelectedSwatch(penColors, penColor);
        markSelectedSwatch(highlightColors, highlightColor);
    }

    function bindColorPicker(group, choose) {
        if (!group) return;
        group.addEventListener('click', (event) => {
            const swatch = event.target.closest('.color-swatch');
            if (!swatch || !swatch.dataset.color) return;
            choose(swatch.dataset.color);
            syncColorPickers();
        });
    }

    bindColorPicker(penColors, (color) => {
        penColor = color;
    });
    bindColorPicker(highlightColors, (color) => {
        highlightColor = color;
    });

    function clearCanvas() {
        if (!els.annotationCanvas || !ctx) return;
        ctx.clearRect(0, 0, els.annotationCanvas.width, els.annotationCanvas.height);
    }

    function getCanvasCoords(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        };
    }

    function startDraw(e, surface) {
        if (currentTool === 'none' || currentTool === 'pointer') return;
        if (e.target && e.target.closest && e.target.closest('.flipchart-close')) return;
        const canvas = surface === 'flipchart' ? els.flipchartCanvas : els.annotationCanvas;
        if (!canvas) return;
        e.preventDefault();
        isDrawing = true;
        drawSurface = surface;
        currentStroke = {
            tool: currentTool,
            color: currentTool === 'pen' ? penColor : highlightColor,
            lineWidth: currentTool === 'pen' ? 3 : 20,
            points: [getCanvasCoords(e, canvas)]
        };
    }

    function drawMove(e) {
        if (!isDrawing || !currentStroke) return;
        const canvas = drawSurface === 'flipchart' ? els.flipchartCanvas : els.annotationCanvas;
        if (!canvas) return;
        e.preventDefault();
        currentStroke.points.push(getCanvasCoords(e, canvas));
        renderStroke(currentStroke, drawSurface);
    }

    function stopDraw() {
        if (!isDrawing || !currentStroke) return;
        isDrawing = false;
        if (drawSurface === 'flipchart') {
            flipchartStrokes.push(currentStroke);
        } else {
            if (!state.slideAnnotations[state.currentIndex]) {
                state.slideAnnotations[state.currentIndex] = [];
            }
            state.slideAnnotations[state.currentIndex].push(currentStroke);
            api.saveAnnotationsToStorage?.();
        }
        currentStroke = null;
        drawSurface = null;
    }

    if (els.annotationCanvas) {
        els.annotationCanvas.addEventListener('mousedown', (e) => startDraw(e, 'slide'));
        els.annotationCanvas.addEventListener('mousemove', drawMove);
        els.annotationCanvas.addEventListener('touchstart', (e) => startDraw(e, 'slide'), { passive: false });
        els.annotationCanvas.addEventListener('touchmove', drawMove, { passive: false });
        els.annotationCanvas.addEventListener('touchend', stopDraw);
    }

    if (els.flipchartCanvas) {
        els.flipchartCanvas.addEventListener('mousedown', (e) => startDraw(e, 'flipchart'));
        els.flipchartCanvas.addEventListener('mousemove', drawMove);
        els.flipchartCanvas.addEventListener('touchstart', (e) => startDraw(e, 'flipchart'), { passive: false });
        els.flipchartCanvas.addEventListener('touchmove', drawMove, { passive: false });
        els.flipchartCanvas.addEventListener('touchend', stopDraw);
    }

    window.addEventListener('mouseup', stopDraw);

    // Place/move pointer on slide click without blocking scroll (els.annotationCanvas is pointer-events: none in pointer mode)
    if (els.slideCard) {
        els.slideCard.addEventListener('click', (e) => {
            if (currentTool !== 'pointer') return;
            // Ignore clicks on the annotation dock tools if they somehow bubble here
            if (e.target.closest && e.target.closest('.annotation-dock, .flipchart-sheet')) return;

            const rect = els.slideCard.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            placeSlidePointer(x, y);
        });
    }

    function renderStroke(stroke, surface) {
        const onFlipchart = surface === 'flipchart';
        const canvas = onFlipchart ? els.flipchartCanvas : els.annotationCanvas;
        const context = onFlipchart ? flipchartCtx : ctx;
        if (!canvas || !context || !stroke.points || stroke.points.length === 0) return;
        const width = canvas.offsetWidth || (onFlipchart ? 0 : SLIDE_DESIGN_WIDTH);
        const height = canvas.offsetHeight || (onFlipchart ? 0 : SLIDE_DESIGN_HEIGHT);
        if (!width || !height) return;

        context.save();
        context.beginPath();

        let strokeColor = stroke.color;
        if (stroke.tool === 'highlighter') {
            const stored = stroke.color || '#ffeb3b';
            // Light marker colors multiply onto slide content. On blank paper they need a visible wash.
            strokeColor = onFlipchart
                ? (HIGHLIGHT_ON_PAPER[stored.toLowerCase()] || 'rgba(202, 138, 4, 0.55)')
                : stored;
        } else if (stroke.tool === 'pen' && (strokeColor === '#ff3b30' || !strokeColor)) {
            strokeColor = '#003865';
        }

        context.strokeStyle = strokeColor;
        context.lineWidth = stroke.lineWidth;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.globalCompositeOperation = 'source-over';

        const pts = stroke.points;
        context.moveTo(pts[0].x * width, pts[0].y * height);
        for (let i = 1; i < pts.length; i++) {
            context.lineTo(pts[i].x * width, pts[i].y * height);
        }
        context.stroke();
        context.restore();
    }

    function clearFlipchartCanvas() {
        if (!els.flipchartCanvas || !flipchartCtx) return;
        flipchartCtx.clearRect(0, 0, els.flipchartCanvas.width, els.flipchartCanvas.height);
    }

    function redrawFlipchart() {
        clearFlipchartCanvas();
        flipchartStrokes.forEach((stroke) => renderStroke(stroke, 'flipchart'));
    }

    function resizeFlipchartCanvas() {
        if (!flipchartOpen || !els.flipchartCanvas || !flipchartCtx) return;
        const width = els.flipchartCanvas.offsetWidth;
        const height = els.flipchartCanvas.offsetHeight;
        if (!width || !height) return;

        const dpr = window.devicePixelRatio || 1;
        els.flipchartCanvas.width = Math.round(width * dpr);
        els.flipchartCanvas.height = Math.round(height * dpr);
        if (flipchartCtx.resetTransform) {
            flipchartCtx.resetTransform();
        } else {
            flipchartCtx.setTransform(1, 0, 0, 1, 0, 0);
        }
        flipchartCtx.scale(dpr, dpr);
        redrawFlipchart();
    }

    function clearFlipchartDrawing() {
        flipchartStrokes = [];
        clearFlipchartCanvas();
    }

    function openFlipchart() {
        if (!els.flipchartSheet) return;
        flipchartOpen = true;
        els.flipchartSheet.hidden = false;
        if (els.flipchartBtn) {
            els.flipchartBtn.classList.add('active');
            els.flipchartBtn.setAttribute('aria-pressed', 'true');
        }
        if (els.flipchartCanvas) {
            const drawing = currentTool === 'pen' || currentTool === 'highlighter';
            els.flipchartCanvas.classList.toggle('drawable', drawing);
        }
        requestAnimationFrame(resizeFlipchartCanvas);
    }

    function closeFlipchart() {
        flipchartOpen = false;
        if (isDrawing && drawSurface === 'flipchart') stopDraw();
        if (els.flipchartSheet) els.flipchartSheet.hidden = true;
        if (els.flipchartBtn) {
            els.flipchartBtn.classList.remove('active');
            els.flipchartBtn.setAttribute('aria-pressed', 'false');
        }
        if (els.flipchartCanvas) els.flipchartCanvas.classList.remove('drawable');
    }

    function redrawCurrentSlideAnnotations() {
        clearCanvas();
        const strokes = state.slideAnnotations[state.currentIndex];
        if (strokes && Array.isArray(strokes)) {
            strokes.forEach(stroke => renderStroke(stroke));
        }
    }

    api.resizeCanvas = resizeCanvas;
    api.clearCanvas = clearCanvas;
    api.clearSlidePointer = clearSlidePointer;
    api.redrawCurrentSlideAnnotations = redrawCurrentSlideAnnotations;
    api.setAnnotationTool = setAnnotationTool;
    Object.defineProperty(api, '_currentTool', { get: () => currentTool, configurable: true });
}
