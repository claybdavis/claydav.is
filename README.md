# claydav.is

Clay Davis's personal academic website, built with [Hugo](https://gohugo.io) and
hosted on GitHub Pages.

## How publishing works

Push to the `main` branch and GitHub automatically rebuilds and publishes the
site within a couple of minutes (the recipe lives in
`.github/workflows/hugo.yaml` — you shouldn't need to touch it).

To preview changes on your own machine before pushing:

```bash
hugo server
```

then open http://localhost:1313. (Install Hugo once with `brew install hugo`.)

## Common updates

**Update the CV.** Drag the new PDF into `static/cv/` and delete the old one.
Any filename works — the CV page shows whatever single PDF is in that folder.

**Add a paper or essay.** Copy an existing file in
`content/research/peer-reviewed-papers/` (or `content/research/essays/`) and
edit its front matter — the fields between the `---` lines: `title`, `date`,
`journal`, `volume`/`issue`, `page_start`/`page_end`, `author`, `cover_image`
(a file placed under `assets/images/publications/`), `external_url`, `doi`.
The abstract goes below the front matter as normal text.

**Add an award.** Copy an existing file in `content/research/awards/` or
`content/teaching/awards/`: `title`, `organization`, `date`, `cover_image`.
Awards have no pages of their own (declared once in that folder's `_index.md`),
so their cards aren't clickable and they stay off the homepage automatically.

**Add a teaching evaluation.** Copy a file in
`content/teaching/student-evaluations/` and fill in the numbered fields.
**Careful:** the CV project in `~/Documents/CV` reads these exact field names
(`evaluation_title_1`, `evaluation_score_1`, …) when it builds the evaluation
bars — don't rename them.

**Edit the bio or research text.** The homepage text is `content/_index.md`;
the research page is `content/research/_index.md`.

**Colors, menu, contact links, widget accounts.** All in `hugo.toml`.
The Goodreads/Bluesky homepage widgets are switched off by
`hide_home_widgets: true` in `content/_index.md`; delete that line to show them.

## Front matter cheat sheet

| Field | What it does |
|---|---|
| `cover_image` | thumbnail image, path under `assets/images/` |
| `landscape: true` | wide thumbnail instead of tall |
| `hide_on_home: true` | keep an item out of the homepage "Recent Publications" |
| `hide_in_parent: true` | don't show a subsection on its parent page |
| `sidebar: "name"` | list page shows `layouts/partials/name.html` as a right-hand column (its `assets/css/name.css` and `assets/js/name.js` load too) |
| `weight` | order of sections on a page (lower comes first) |

## What's in each folder

- `content/` — all the words, as Markdown files; the folder structure is the site structure
- `layouts/` — the HTML templates that wrap the words
- `assets/` — stylesheets (`css/`), scripts (`js/`), and images Hugo optimizes
- `static/` — files served exactly as-is: the CV, fonts, icons, data files
