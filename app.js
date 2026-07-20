document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const slideCard = document.getElementById('slide-card');
    const slideCounter = document.getElementById('slide-counter');
    const progressBar = document.getElementById('progress-bar');
    const courseTitle = document.getElementById('course-title');
    
    // Stage Arrow Buttons
    const stagePrevBtn = document.getElementById('stage-prev-btn');
    const stageNextBtn = document.getElementById('stage-next-btn');
    
    // Footer Navigation Buttons
    const firstSlideBtn = document.getElementById('first-slide-btn');
    const prevSlideBtn = document.getElementById('prev-slide-btn');
    const nextSlideBtn = document.getElementById('next-slide-btn');
    const lastSlideBtn = document.getElementById('last-slide-btn');
    
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
    
    // Font Scaling
    fontDecrease.addEventListener('click', () => {
        currentFontSize = Math.max(70, currentFontSize - 10);
        document.body.style.fontSize = `${currentFontSize}%`;
    });
    
    fontIncrease.addEventListener('click', () => {
        currentFontSize = Math.min(200, currentFontSize + 10);
        document.body.style.fontSize = `${currentFontSize}%`;
    });
    
    // Fullscreen Mode Toggle
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
                slideCard.innerHTML = '<div class="error">No slides found in the specified Markdown file.</div>';
                return;
            }
            
            // Build Slide Drawer / TOC
            buildSlideDrawer();
            
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
            slideCard.innerHTML = `<div class="error">
                <strong>Failed to load course slides from URL:</strong><br>
                <code>${courseUrl}</code><br><br>
                <strong>Error:</strong> ${error.message}
            </div>`;
        });

    // Slide Drawer Generator
    function buildSlideDrawer() {
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
            
            // Update course title toolbar with Chapter title from first slide heading
            if (index === 0 && title !== `Slide 1`) {
                courseTitle.textContent = title;
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

    // Navigation Button Event Listeners
    stagePrevBtn.addEventListener('click', prevSlide);
    stageNextBtn.addEventListener('click', nextSlide);
    prevSlideBtn.addEventListener('click', prevSlide);
    nextSlideBtn.addEventListener('click', nextSlide);
    firstSlideBtn.addEventListener('click', () => goToSlide(0));
    lastSlideBtn.addEventListener('click', () => goToSlide(slides.length - 1));

    // Render Slide Content
    function renderSlide(index) {
        const slideMarkdown = slides[index];
        const html = marked.parse(slideMarkdown);
        
        // Re-trigger fade animation
        slideCard.classList.remove('slide-card');
        void slideCard.offsetWidth; // Trigger reflow
        slideCard.classList.add('slide-card');
        
        slideCard.innerHTML = html;
        
        // Process GitHub Callout Alerts
        processGitHubAlerts(slideCard);
        
        // Resolve relative image URLs
        processRelativeImages(slideCard);
        
        // Setup code block copy buttons
        processCodeCopyButtons(slideCard);
        
        // Ensure links open in a new tab
        processExternalLinks(slideCard);
        
        // Update Slide Counter & Progress Bar
        slideCounter.textContent = `Slide ${index + 1} of ${slides.length}`;
        const progressPercent = ((index + 1) / slides.length) * 100;
        progressBar.style.width = `${progressPercent}%`;
        
        // Update Nav Button Enabled / Disabled States
        stagePrevBtn.disabled = prevSlideBtn.disabled = firstSlideBtn.disabled = (index === 0);
        stageNextBtn.disabled = nextSlideBtn.disabled = lastSlideBtn.disabled = (index === slides.length - 1);
        
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
        // Ignore key events if focused on input elements
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
});
