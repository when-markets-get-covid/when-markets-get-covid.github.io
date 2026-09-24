# When the Markets Get COVID — paper website

Static site for "When the Markets Get CO.V.I.D: COntagion, Viruses, and Information
Diffusion" (Arteaga-Garavito, Croce, Farroni & Wolfskeil), *Journal of Financial
Economics* 157 (2024), 103850. Live at https://when-markets-get-covid.github.io/

No build step. It's plain HTML/CSS/JS, served by GitHub Pages.

## Structure

Layout matches international-climate-news.github.io (Fraunces + Inter); palette is navy/blue.
Content follows the original Google Site (Home · Tweets-based · Announcements · Authors · Extra/LDA).

- `index.html` — Home: title, abstract, authors, links to the two studies
- `tweets.html` — Tweets-based study: interactive charts + takeaways, pricing model, published figures
- `announcements.html` — Announcements study: model, interactive equity/bond charts, dataset explorer, Table 1, published figures
- `topics.html` — LDA topic models by country (pyLDAvis pages in `assets/lda/`)
- `data.html` — JFE paper, published Internet Appendix, announcements CSV + codebook, replication package, BibTeX
- `assets/css/style.css` — climate-site stylesheet + additions at the bottom
- `assets/js/main.js` — Plotly chart rendering, announcements explorer, LDA viewer, BibTeX copy
- `assets/plots/*.json` — Plotly figures from Writing/Webpage/Why_Markets_Get_COVID_webpage_main.ipynb (restyled; tone series trimmed to 02/22/2022)
- `assets/lda/*.html` — Codes/Majo/output/topics5 (5-topic LDAvis), wrapped as standalone pages
- `assets/data/` — public announcements CSV and the weekly JSON built from it
- `assets/img/figures/` — figures from the JFE version (Writing_JFE/Figures)
- `assets/img/authors/` — headshots (Paolo still shows initials: add `paolo.jpg` and swap it in index.html)
- `assets/docs/Internet_Appendix.pdf` — published supplementary material (ScienceDirect mmc1)

Math is rendered with KaTeX, charts with Plotly.js (both from cdn.jsdelivr.net).

## Rebuilding the weekly JSON (only if the CSV changes)

```
python3 tools/build_weekly.py
```

## Local preview

```
cd site
python3 -m http.server 8000
# open http://localhost:8000   (the explorer needs http://, not file://)
```
