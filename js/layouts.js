/* Slide HTML post-processing: alerts, images, layout directives, columns. */
import { state } from './state.js';

export function processGitHubAlerts(container) {
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
export function processRelativeImages(container) {
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
        if (state.localAssetMap) {
            const mapped = state.localAssetMap.get(cleanSrc) || state.localAssetMap.get(decodeURIComponent(cleanSrc));
            if (mapped) {
                img.src = mapped;
                return;
            }
        }
        if (state.courseBaseUrl) {
            img.src = state.courseBaseUrl + cleanSrc;
        }
    });
}

// Extract layout directive from slide markdown (e.g. <!-- layout: navigation -->)
export function extractLayoutDirective(slideMarkdown, index) {
    const match = slideMarkdown.match(/<!--\s*layout:\s*([a-z0-9_-]+)\s*-->/i);
    if (match) {
        let layout = match[1].toLowerCase();
        if (layout === '3-column') layout = 'three-column';
        if (layout === '2-column') layout = 'two-column';
        if (layout === 'stack') layout = 'stacked';
        if (layout === 'image' || layout === 'image_only') layout = 'image-only';
        return layout;
    }
    if (index === 0) return 'title';
    return 'content';
}

/**
 * Turn a standalone <!-- below-columns --> line into a DOM sentinel so column
 * builders can leave following content (e.g. full-width alerts) outside the columns.
 * Only whole-line markers are converted so instructional text can mention the comment.
 */
export function prepareSlideHtml(slideMarkdown) {
    const prepared = String(slideMarkdown || '').replace(
        /^[ \t]*<!--\s*below-columns\s*-->[ \t]*$/gim,
        '<div class="below-columns-break" hidden aria-hidden="true"></div>'
    );
    return window.marked.parse(prepared);
}

// Process Navigation Agenda Slide styling
export function processNavigationLayout(container) {
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
export function processSplitLayouts(container) {
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
export function processStackedLayout(container) {
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
export function processThreeColumnLayout(container) {
    processColumnLayout(container, 'three-column-wrapper');
}

// Automatically format slides with two custom columns (headers and lists)
export function processTwoColumnLayout(container) {
    processColumnLayout(container, 'two-column-wrapper');
}

export function findColumnHeaders(container) {
    let headers = Array.from(container.querySelectorAll('h3'));
    if (headers.length === 0) {
        headers = Array.from(container.querySelectorAll('h2'));
    }
    if (headers.length === 0) {
        headers = Array.from(container.querySelectorAll('h4'));
    }
    return headers;
}

/**
 * Split slide content into equal columns starting at ### (or ## / ####) headers.
 * Optional <!-- below-columns --> (converted to .below-columns-break) ends the
 * column region so following content stays full slide width.
 */
export function processColumnLayout(container, wrapperClassName) {
    if (container.querySelector(`.${wrapperClassName}`)) {
        return;
    }

    const headers = findColumnHeaders(container);
    if (headers.length < 2) return;

    const children = Array.from(container.children);
    const firstHeaderIndex = children.indexOf(headers[0]);
    if (firstHeaderIndex < 0) return;

    const breakEl = container.querySelector('.below-columns-break');
    let endIndex = children.length;
    if (breakEl) {
        const breakIndex = children.indexOf(breakEl);
        if (breakIndex > firstHeaderIndex) {
            endIndex = breakIndex;
        }
    }

    const insertReference = children[firstHeaderIndex];
    const originalParent = insertReference ? insertReference.parentNode : null;
    if (!originalParent) return;

    const wrapper = document.createElement('div');
    wrapper.className = wrapperClassName;
    originalParent.insertBefore(wrapper, insertReference);

    let currentColumn = null;
    for (let i = firstHeaderIndex; i < endIndex; i++) {
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

    if (breakEl && breakEl.parentNode) {
        breakEl.remove();
    }
}

// Add Code Block Copy Buttons
export function processCodeCopyButtons(container) {
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
export function processExternalLinks(container) {
    const links = container.querySelectorAll('a');
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}
