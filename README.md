# Academic Site with Editor and Analytics

A static site for GitHub Pages. Content lives in `content.json`. A password-protected editor at `/admin/` edits that file and publishes to GitHub. Page views are tracked with GoatCounter.

## Files

```
index.html        public homepage (loads content.json)
content.json      all your content: profile, CV, research, teaching, projects, analytics settings
styles.css        public styles, light and dark mode, print CSS for a clean CV
script.js         renders the page, SEO meta, analytics and click tracking
admin/index.html  editor page
admin/admin.js    editor logic (GitHub API)
admin/admin.css   editor styles
robots.txt        search engine rules (editor excluded)
sitemap.xml       sitemap for search engines
```

## 1. Deploy to GitHub Pages

Your site is `https://rezanazariye.github.io/`, a user site, so the repository must be named exactly `rezanazariye.github.io`.

1. Open the repository on GitHub and upload all files and folders here, keeping the `admin/` folder. Or run:

   ```bash
   git clone https://github.com/rezanazariye/rezanazariye.github.io.git
   cd rezanazariye.github.io
   # copy everything from this folder into here
   git add .
   git commit -m "Academic site with editor and analytics"
   git push origin main
   ```

2. Go to **Settings → Pages**, set **Source** to *Deploy from a branch*, branch `main`, folder `/ (root)`, and save.
3. Wait about a minute, then open `https://rezanazariye.github.io/`.

## 2. Turn on view tracking (GoatCounter)

GoatCounter is free for personal sites, does not use cookies, and does not need a consent banner.

1. Sign up at **https://www.goatcounter.com** and pick a code, for example `rezanazariye`. The dashboard is then at `https://rezanazariye.goatcounter.com`.
2. Open `/admin/`, go to the **Analytics** tab, enter the code, and save.

The site now records:

- **Page views**: total, per page, unique visitors, and time-series charts
- **Referrers**: where visitors came from (Google, LinkedIn, GitHub, direct links)
- **Locations, browsers, and devices**
- **Events**: CV downloads, PDF downloads, project clicks, social link clicks, copied email, and contact form submissions

Event names are listed in `script.js` under `data-track`. Add `data-track="my-name"` to any link to count it.

Notes:
- Ad blockers may block GoatCounter, so counts are a lower bound.
- Your own visits can be ignored by using the GoatCounter filter for your browser, or by visiting in a private window.
- For search keywords, set up **Google Search Console** for `https://rezanazariye.github.io/`. It shows which queries bring people to the site, but it cannot see per-visitor activity.

## 3. Set up the editor

The editor uses the GitHub API. It needs a token that can write only to this repository.

1. On GitHub go to **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
2. Set:
   - **Repository access:** *Only select repositories* → `rezanazariye.github.io`
   - **Permissions → Repository permissions → Contents:** *Read and write*
   - **Expiration:** 90 days (you'll need to create a new one when it expires)
3. Copy the token. GitHub shows it only once.
4. Open `https://rezanazariye.github.io/admin/`, enter the owner and repository name (filled in automatically), paste the token, and click **Connect**.

Security notes:
- Anyone who has the token can change this repository's content. Keep it private, and don't commit it anywhere.
- The token is kept in `sessionStorage`, so it is removed when you close the browser tab. Use **Log out** on shared computers.
- `/admin/` is hidden from search engines, but it is still a public URL. Without the token it shows only a login form.

## 4. Edit your content

1. Open `/admin/` and choose a section in the sidebar (Profile, CV, Research, and so on).
2. Edit fields, use **+ Add item** for new entries, **↑ ↓** to reorder, and **Delete** to remove them.
3. Click **Save & publish**. GitHub commits `content.json` and Pages rebuilds in about a minute.

Upload PDFs (CV, papers, slides) in the **Files** tab. Copy the URL it gives you and paste it into the CV, research, or teaching field. Keep file names short, without spaces.

## Customising

- **Colours:** change the `--accent` variable in `styles.css` (for example `#2f5bea`).
- **Sections:** the public sections are in `script.js` and the editor schema is in `admin/admin.js` (the `SECTIONS` array). A new field needs an entry in both.
- **Fonts:** Inter is loaded from Google Fonts in `index.html`.

## Troubleshooting

| Problem | Fix |
|---|---|
| Page shows "Content could not be loaded" | Check that `content.json` is in the repository root and is valid JSON. |
| Changes don't show up | Wait 1–2 minutes, then hard-refresh (Ctrl/Cmd+Shift+R). |
| Editor says the token was rejected | The token may have expired, or it isn't scoped to this repository. Create a new one. |
| "The file changed somewhere else" | Someone (or you, in another tab) saved first. Reload the editor and re-apply your change. |
| No analytics appear | Confirm the GoatCounter code in the Analytics tab. Visits can take a few minutes to show. |
