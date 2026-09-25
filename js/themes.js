/* Discover slide themes from the @import lines in style.css.
   A browser cannot list css/themes/ on static hosting, so the stylesheet
   import list is the catalog. Each theme file declares its picker name with
   a first-line comment: theme-label: My Theme */

const THEME_ALIASES = { 'roi-default': 'roi-theme' };

function labelFromId(id) {
    const words = String(id || '')
        .replace(/-theme$/, '')
        .split('-')
        .filter(Boolean);
    if (!words.length) return 'Theme';
    return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function parseThemeFile(cssText) {
    const idMatch = String(cssText || '').match(/html\[data-theme="([^"]+)"\]/);
    if (!idMatch) return null;
    const labelMatch = String(cssText).match(/theme-label:\s*([^\n*]+)/i);
    const label = labelMatch ? labelMatch[1].trim() : labelFromId(idMatch[1]);
    return { id: idMatch[1], label };
}

export async function loadSlideThemes(selectEl) {
    const link = document.querySelector('link[rel="stylesheet"][href*="style.css"]');
    const styleUrl = link ? link.href : new URL('style.css', window.location.href).href;
    const styleText = await fetch(styleUrl, { cache: 'no-store' }).then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status} loading themes`);
        return response.text();
    });

    const imports = [];
    const importRe = /@import\s+url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
    let match;
    while ((match = importRe.exec(styleText))) {
        if (match[1].includes('css/themes/')) imports.push(match[1]);
    }

    const themes = [];
    await Promise.all(imports.map(async (rel, order) => {
        try {
            const url = new URL(rel, styleUrl);
            const text = await fetch(url, { cache: 'no-store' }).then((response) => response.ok ? response.text() : '');
            const theme = parseThemeFile(text);
            if (theme) themes.push({ ...theme, order });
        } catch (_) { /* skip a theme file that fails to load */ }
    }));

    themes.sort((a, b) => a.order - b.order);
    const unique = [];
    const seen = new Set();
    themes.forEach((theme) => {
        if (seen.has(theme.id)) return;
        seen.add(theme.id);
        unique.push(theme);
    });

    if (selectEl) {
        const previous = selectEl.value;
        selectEl.innerHTML = '';
        unique.forEach((theme) => {
            const option = document.createElement('option');
            option.value = theme.id;
            option.textContent = theme.label;
            selectEl.appendChild(option);
        });
        if (previous && seen.has(previous)) selectEl.value = previous;
    }

    return unique.map((theme) => theme.id);
}

export function resolveThemeName(name, available) {
    const ids = available && available.length ? available : ['roi-theme'];
    const mapped = THEME_ALIASES[name] || name;
    if (ids.includes(mapped)) return mapped;
    if (ids.includes('roi-theme')) return 'roi-theme';
    return ids[0];
}
