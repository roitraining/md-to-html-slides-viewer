/* Annotation toolbox: pen, highlighter, pointer. */
import { state, els, api, SLIDE_DESIGN_WIDTH, SLIDE_DESIGN_HEIGHT, SLIDE_DESIGN_FONT_PX } from './state.js';

export function initAnnotations() {
    const canvasEl = els.annotationCanvas;
    const ctx = canvasEl ? canvasEl.getContext('2d') : null;
    // ==========================================
    // Slide Annotation System (Pen, Highlighter & Pointer)
    // ==========================================
    let currentTool = 'none'; // 'none' | 'pen' | 'highlighter' | 'pointer'
    let isDrawing = false;
    let currentStroke = null;

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
    }

    function getCanvasLayoutSize() {
        if (!els.annotationCanvas) return { width: SLIDE_DESIGN_WIDTH, height: SLIDE_DESIGN_HEIGHT };
        return {
            width: els.annotationCanvas.offsetWidth || SLIDE_DESIGN_WIDTH,
            height: els.annotationCanvas.offsetHeight || SLIDE_DESIGN_HEIGHT
        };
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

        // Pointer is only visible while the pointer tool is active
        if (tool !== 'pointer') {
            clearSlidePointer();
        }
    }

    function clearCanvas() {
        if (!els.annotationCanvas || !ctx) return;
        ctx.clearRect(0, 0, els.annotationCanvas.width, els.annotationCanvas.height);
    }

    function getCanvasCoords(e) {
        const rect = els.annotationCanvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
            x: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
            y: Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        };
    }

    if (els.annotationCanvas) {
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
        
            if (!state.slideAnnotations[state.currentIndex]) {
                state.slideAnnotations[state.currentIndex] = [];
            }
            state.slideAnnotations[state.currentIndex].push(currentStroke);
            currentStroke = null;
            api.saveAnnotationsToStorage?.();
        };

        els.annotationCanvas.addEventListener('mousedown', startDraw);
        els.annotationCanvas.addEventListener('mousemove', drawMove);
        window.addEventListener('mouseup', stopDraw);

        els.annotationCanvas.addEventListener('touchstart', startDraw, { passive: false });
        els.annotationCanvas.addEventListener('touchmove', drawMove, { passive: false });
        els.annotationCanvas.addEventListener('touchend', stopDraw);
    }

    // Place/move pointer on slide click without blocking scroll (els.annotationCanvas is pointer-events: none in pointer mode)
    if (els.slideCard) {
        els.slideCard.addEventListener('click', (e) => {
            if (currentTool !== 'pointer') return;
            // Ignore clicks on the annotation dock tools if they somehow bubble here
            if (e.target.closest && e.target.closest('.annotation-dock')) return;

            const rect = els.slideCard.getBoundingClientRect();
            if (!rect.width || !rect.height) return;
            const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
            placeSlidePointer(x, y);
        });
    }

    function renderStroke(stroke) {
        if (!els.annotationCanvas || !ctx || !stroke.points || stroke.points.length === 0) return;
        const { width, height } = getCanvasLayoutSize();

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
        ctx.moveTo(pts[0].x * width, pts[0].y * height);
        for (let i = 1; i < pts.length; i++) {
            ctx.lineTo(pts[i].x * width, pts[i].y * height);
        }
        ctx.stroke();
        ctx.restore();
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
