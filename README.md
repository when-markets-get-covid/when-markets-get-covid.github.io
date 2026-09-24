# When the Markets Get COVID — paper website

Static site for "When the Markets Get CO.V.I.D: COntagion, Viruses, and Information
Diffusion" (Arteaga-Garavito, Croce, Farroni & Wolfskeil), *Journal of Financial
Economics* 157 (2024), 103850. Live at https://when-markets-get-covid.github.io/

No build step. It's plain HTML/CSS/JS, served by GitHub Pages.

## Structure

- `index.html` — Home: title, key numbers, abstract, three main findings, authors
- `announcements.html` — Part I: model intuition, announcements dataset + interactive explorer, equity/bond results
- `tweets.html` — Part II: Twitter news diffusion, tone factor, market price of risk, risk premia
- `data.html` — JFE / SSRN / Internet Appendix, announcements CSV + codebook, replication package, BibTeX
- `assets/css/style.css` — shared stylesheet (light + dark theme)
- `assets/js/main.js` — theme toggle, BibTeX copy, hero curve + explorer chart
- `assets/data/covid19_announcements.csv` — public announcements dataset (from Data_JFE/Announcements)
- `assets/data/announcements_weekly.json` — weekly counts by country × category, built from the CSV
- `assets/img/figures/` — figures from the JFE version (Writing_JFE/Figures, resized to 1600px)
- `assets/img/authors/` — headshots (add `paolo.jpg`, `isabella.jpg` and swap the initials avatars in index.html)
- `assets/docs/Internet_Appendix.pdf`
- `tools/build_weekly.py` — regenerates the weekly JSON from the CSV

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
