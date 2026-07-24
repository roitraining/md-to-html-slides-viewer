document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const slideCard = document.getElementById('slide-card');
    const slideBody = document.getElementById('slide-body');
    const footerSlideNumber = document.getElementById('footer-slide-number');
    const footerCourseTitle = document.getElementById('footer-course-title');
    const progressBar = document.getElementById('progress-bar');
    const courseTitle = document.getElementById('course-title');
    
    // Stage Arrow Buttons
    const stagePrevBtn = document.getElementById('stage-prev-btn');
    const stageNextBtn = document.getElementById('stage-next-btn');
    
    // Side Menu Drawer Elements
    const menuToggle = document.getElementById('menu-toggle');
    const closeMenu = document.getElementById('close-menu');
    const sideMenu = document.getElementById('side-menu');
    const slideList = document.getElementById('slide-list');
    
    // Controls
    const themeToggle = document.getElementById('theme-toggle');
    const fontDecrease = document.getElementById('font-decrease');
    const fontIncrease = document.getElementById('font-increase');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    
    // Application State
    let slides = [];
    let currentIndex = 0;
    let currentFontSize = 100;
    let courseBaseUrl = '';
    
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
    
    // Font Scaling Initialization & Logic
    const savedFontSize = localStorage.getItem('slides-viewer-font-size');
    if (savedFontSize) {
        currentFontSize = parseInt(savedFontSize, 10);
        updateFontSize();
    }

    function updateFontSize() {
        if (slideCard) slideCard.style.fontSize = `${currentFontSize}%`;
        document.body.style.fontSize = `${currentFontSize}%`;
        localStorage.setItem('slides-viewer-font-size', currentFontSize);
        fitFooterCourseTitle();
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
    
    fontDecrease.addEventListener('click', () => {
        currentFontSize = Math.max(70, currentFontSize - 10);
        updateFontSize();
    });
    
    fontIncrease.addEventListener('click', () => {
        currentFontSize = Math.min(200, currentFontSize + 10);
        updateFontSize();
    });
    
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
    
    // Side Menu Drawer interactions
    menuToggle.addEventListener('click', () => sideMenu.classList.add('open'));
    closeMenu.addEventListener('click', () => sideMenu.classList.remove('open'));
    
    // Marked syntax highlight options
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        langPrefix: 'hljs language-'
    });
    
    // Get Course URL from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    let courseUrl = urlParams.get('course') || urlParams.get('lab') || urlParams.get('url');
    
    // Default to local sample course if no URL provided
    if (!courseUrl) {
        courseUrl = './sample-course.md';
    } else {
        // Automatically convert standard GitHub web URLs to raw URLs
        if (courseUrl.startsWith('https://github.com/')) {
            courseUrl = courseUrl.replace('https://github.com/', 'https://raw.githubusercontent.com/');
            courseUrl = courseUrl.replace('/blob/', '/').replace('/tree/', '/');
            
            if (!courseUrl.match(/\.md$/i) && !courseUrl.match(/\.markdown$/i)) {
                if (!courseUrl.endsWith('/')) {
                    courseUrl += '/';
                }
                courseUrl += 'README.md';
            }
        }
    }
    
    courseBaseUrl = courseUrl.substring(0, courseUrl.lastIndexOf('/') + 1);
    
    // Fetch and parse presentation Markdown
    fetch(courseUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(markdownText => {
            // Split markdown into individual slides using horizontal rules (---)
            slides = markdownText
                .split(/\r?\n---\r?\n/)
                .map(slide => slide.trim())
                .filter(slide => slide.length > 0);
            
            if (slides.length === 0) {
                slideBody.innerHTML = '<div class="error">No slides found in the specified Markdown file.</div>';
                return;
            }
            
            // Extract explicit course title comment if present (e.g. <!-- course-title: 815: Hands-On Terraform -->)
            const commentMatch = markdownText.match(/<!--\s*(?:course-title|course_title|course|footer-title|footer_title):\s*(.*?)\s*-->/i);
            const customCourseTitle = commentMatch ? commentMatch[1].trim() : '';
            
            if (customCourseTitle) {
                if (footerCourseTitle) footerCourseTitle.textContent = customCourseTitle;
                if (courseTitle) courseTitle.textContent = customCourseTitle;
                requestAnimationFrame(() => fitFooterCourseTitle());
            }
            
            // Build Slide Drawer / TOC
            buildSlideDrawer(customCourseTitle);
            
            // Check initial URL hash for slide index (e.g. #slide-3 or #3)
            const hash = window.location.hash;
            let initialIndex = 0;
            if (hash) {
                const match = hash.match(/#(?:slide-)?(\d+)/i);
                if (match) {
                    initialIndex = parseInt(match[1], 10) - 1;
                }
            }
            
            // Render initial slide
            goToSlide(initialIndex);
        })
        .catch(error => {
            console.error('Error loading course:', error);
            slideBody.innerHTML = `<div class="error">
                <strong>Failed to load course slides from URL:</strong><br>
                <code>${courseUrl}</code><br><br>
                <strong>Error:</strong> ${error.message}
            </div>`;
        });

    // Slide Drawer Generator
    function buildSlideDrawer(customCourseTitle) {
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
            a.innerHTML = `<strong>${index + 1}.</strong> ${title}`;
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                goToSlide(index);
                sideMenu.classList.remove('open');
            });
            
            li.appendChild(a);
            slideList.appendChild(li);
        });
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

    // Navigation Arrow Event Listeners
    stagePrevBtn.addEventListener('click', prevSlide);
    stageNextBtn.addEventListener('click', nextSlide);

    // Render Slide Content
    function renderSlide(index) {
        const slideMarkdown = slides[index];
        const layoutType = extractLayoutDirective(slideMarkdown, index);
        const html = marked.parse(slideMarkdown);
        
        // Remove existing layout classes and add new layout class
        slideCard.classList.remove('layout-title', 'layout-navigation', 'layout-section', 'layout-split', 'layout-content', 'layout-three-column', 'layout-title-image', 'layout-two-column');
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
        }
        
        // Process GitHub Callout Alerts
        processGitHubAlerts(slideBody);
        
        // Resolve relative image URLs
        processRelativeImages(slideBody);
        
        // Auto-format 2-column layout (bullets left, image right)
        processSplitLayouts(slideBody);
        
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
        
        // Update Nav Arrow Enabled / Disabled States
        stagePrevBtn.disabled = (index === 0);
        stageNextBtn.disabled = (index === slides.length - 1);
        
        // Update Active Item in Side Drawer
        const drawerLinks = slideList.querySelectorAll('a');
        drawerLinks.forEach((link, idx) => {
            if (idx === index) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Sync URL Hash without jumping window scroll
        history.replaceState(null, '', `#slide-${index + 1}`);
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

    // Resolve relative image URLs
    function processRelativeImages(container) {
        const images = container.querySelectorAll('img');
        images.forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                let cleanSrc = src;
                if (cleanSrc.startsWith('./')) {
                    cleanSrc = cleanSrc.substring(2);
                } else if (cleanSrc.startsWith('/')) {
                    cleanSrc = cleanSrc.substring(1);
                }
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
        if (container.querySelector('.split-layout, .two-column, .grid-2col')) {
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
            case 'c':
            case 'C':
                e.preventDefault();
                slideAnnotations[currentIndex] = [];
                saveAnnotationsToStorage();
                clearCanvas();
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
            processSplitLayouts(body);
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
        await new Promise(resolve => setTimeout(resolve, 300));

        if (exportPdfBtn) exportPdfBtn.textContent = '🖨️';

        // Trigger native print / PDF export dialog
        window.print();
    }

    window.addEventListener('afterprint', () => {
        if (printStage) {
            printStage.innerHTML = '';
        }
    });

    // ==========================================
    // Slide Annotation System (Pen & Highlighter)
    // ==========================================
    const canvas = document.getElementById('annotation-canvas');
    const ctx = canvas ? canvas.getContext('2d') : null;
    const penBtn = document.getElementById('pen-tool-btn');
    const highlighterBtn = document.getElementById('highlighter-tool-btn');
    const clearBtn = document.getElementById('clear-canvas-btn');

    let currentTool = 'none'; // 'none' | 'pen' | 'highlighter'
    let isDrawing = false;
    let currentStroke = null;

    // Persistent storage of strokes per slide index
    let slideAnnotations = {};
    const storageKey = `slides-annotations-${courseUrl}`;
    const savedAnnotations = localStorage.getItem(storageKey);
    if (savedAnnotations) {
        try {
            slideAnnotations = JSON.parse(savedAnnotations);
        } catch (e) {
            slideAnnotations = {};
        }
    }

    function saveAnnotationsToStorage() {
        localStorage.setItem(storageKey, JSON.stringify(slideAnnotations));
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

    const deleteAllBtn = document.getElementById('delete-all-canvas-btn');

    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            slideAnnotations[currentIndex] = [];
            saveAnnotationsToStorage();
            clearCanvas();
        });
    }

    if (deleteAllBtn) {
        deleteAllBtn.addEventListener('click', () => {
            slideAnnotations = {};
            localStorage.removeItem(storageKey);
            clearCanvas();
        });
    }

    function setAnnotationTool(tool) {
        currentTool = tool;
        if (penBtn) penBtn.classList.toggle('active', tool === 'pen');
        if (highlighterBtn) highlighterBtn.classList.toggle('active', tool === 'highlighter');

        if (canvas) {
            if (tool !== 'none') {
                canvas.classList.add('active-tool');
            } else {
                canvas.classList.remove('active-tool');
            }
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
            if (currentTool === 'none') return;
            e.preventDefault();
            isDrawing = true;
            const pt = getCanvasCoords(e);
            
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
