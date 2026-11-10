# TODO

Parked on 2026-11-10. Do this later.

## Proxy GitHub folder listings

The viewer lists course folders by calling `https://api.github.com` from the browser with no token (`githubApiFetch` in `js/course.js`). GitHub allows 60 of those requests per hour per public IP. A classroom on one network shares that budget. Slide Markdown from `raw.githubusercontent.com` does not use this budget. Opening one `.md` file still works when the limit is hit. Listing a repo or folder, and discovering sibling chapters, does not.

Fix when we pick this up:

- The browser calls same-origin `/github-api/repos/...` instead of `api.github.com`.
- `nginx.conf` proxies only `GET` under that path, adds a server-side token, and caches 200 responses for about 5 minutes. `proxy_cache_path` sits outside the `server` block.
- The nginx image substitutes `${GITHUB_TOKEN}` only from a template, so `Dockerfile` copies the config to `/etc/nginx/templates/default.conf.template` and creates `/var/cache/nginx/github` owned by `nginx`.
- `localhost` and `127.0.0.1` keep calling `api.github.com` directly, because `python3 -m http.server` has no proxy.
- Cloud Run receives `GITHUB_TOKEN` from Secret Manager.

The token belongs to the ROI organization: a GitHub App installed on `roitraining`, with public-repository contents read. A personal access token is only a trial, because the rate limit and the revoke button then belong to that person. Do not reuse the course-factory token. That token creates repositories and writes files. Do not put this token in browser JavaScript. Do not proxy without a token, or every visitor shares Cloud Run's one IP and its 60-request budget.

`nginx.editor.conf` stays unchanged. The editor does not call the GitHub API.

## Also noted in the same review

Separate from the proxy. Not scheduled.

- Course HTML and failed-load error text are assigned with `innerHTML`, and `marked` is unsanitized. A share link can run an event handler on the viewer origin. Drawer titles do this too. The editor titles use `textContent`.
- `marked` is loaded from jsDelivr with no version and no integrity hash.
- Cache-bust query strings have drifted (`style.css` v=80, `main.js` v=65, `layouts.js` v=47), and nginx caches JS and CSS for one hour.
- No automated tests for URL parsing, layout comments, or chapter discovery.
- `ace-cert-prep-course/` is course content in the viewer repo. The image does not copy it.
- `js/editor.js` repeats drawer, theme, and chapter UI that the viewer already has.
