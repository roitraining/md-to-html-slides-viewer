/* Slide viewer entry point. Classic scripts (marked, highlight.js) load first in index.html. */
import { bindDom, api } from './state.js';
import { initChrome } from './chrome.js';
import { initDrawer } from './drawer.js';
import { initSlides } from './slides.js';
import { initAnnotations } from './annotations.js';
import { initPrint } from './print.js';
import { initCourse } from './course.js';
import { initKeyboard } from './keyboard.js';

function showStartError(err) {
    console.error(err);
    const body = document.getElementById('slide-body');
    if (body) {
        body.innerHTML = `<div class="error"><strong>Failed to start the slide viewer.</strong><br>${err.message}</div>`;
    }
}

function start() {
    try {
        bindDom();

        if (window.marked && window.hljs) {
            window.marked.setOptions({
                highlight: function (code, lang) {
                    const language = window.hljs.getLanguage(lang) ? lang : 'plaintext';
                    return window.hljs.highlight(code, { language }).value;
                },
                langPrefix: 'hljs language-'
            });
        }

        initChrome();
        initDrawer();
        initSlides();
        initAnnotations();
        initPrint();
        initCourse();
        initKeyboard();

        api.bootFromQueryOrDefault?.();
    } catch (err) {
        showStartError(err);
    }
}

// ES modules are deferred. DOMContentLoaded may already have fired by the time this runs.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
} else {
    start();
}
