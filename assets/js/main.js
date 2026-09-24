/* When the Markets Get COVID — site behavior
   - light/dark theme toggle (remembered per browser)
   - BibTeX copy button
   - hero curve + announcements explorer, both drawn from assets/data/announcements_weekly.json */

(function () {
  var root = document.documentElement;
  var DATA_URL = "assets/data/announcements_weekly.json";
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- Theme ---------- */
  try {
    var saved = localStorage.getItem("wmgc-theme");
    if (saved) root.setAttribute("data-theme", saved);
  } catch (e) {}

  function isDark() {
    var t = root.getAttribute("data-theme");
    if (t) return t === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  function syncToggle() {
    var btn = document.querySelector(".theme-toggle");
    if (btn) {
      btn.textContent = isDark() ? "☀" : "☾";
      btn.setAttribute("aria-label", isDark() ? "Switch to light theme" : "Switch to dark theme");
    }
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest(".theme-toggle");
    if (t) {
      var next = isDark() ? "light" : "dark";
      root.setAttribute("data-theme", next);
      try { localStorage.setItem("wmgc-theme", next); } catch (err) {}
      syncToggle();
      if (window.__redrawExplorer) window.__redrawExplorer();
    }

    var c = e.target.closest(".copy-btn");
    if (c) {
      var target = document.querySelector(c.dataset.copyTarget);
      if (!target || !navigator.clipboard) return;
      navigator.clipboard.writeText(target.innerText.trim()).then(function () {
        var original = c.textContent;
        c.textContent = "Copied";
        setTimeout(function () { c.textContent = original; }, 1500);
      });
    }
  });

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function fmtDate(iso) {
    var d = new Date(iso + "T00:00:00Z");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }

  function totals(data, codes, cats) {
    var n = data.weeks.length, out = new Array(n).fill(0);
    codes.forEach(function (c) {
      cats.forEach(function (cat) {
        var s = data.countries[c].series[cat];
        for (var i = 0; i < n; i++) out[i] += s[i];
      });
    });
    return out;
  }

  /* ---------- Hero curve ---------- */
  function drawHero(data) {
    var host = document.getElementById("hero-curve");
    if (!host) return;
    var codes = Object.keys(data.countries);
    // drop the final week: the sample ends on its first day, so it would read as a false collapse
    var y = totals(data, codes, data.categories).slice(0, -1);
    var W = 1000, H = 170, max = Math.max.apply(null, y);
    var svg = el("svg", { viewBox: "0 0 " + W + " " + H, preserveAspectRatio: "none", "aria-hidden": "true" });
    var defs = el("defs", {}, svg);
    var g = el("linearGradient", { id: "heroFill", x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el("stop", { offset: "0%", "stop-color": "#43c6bb", "stop-opacity": ".45" }, g);
    el("stop", { offset: "100%", "stop-color": "#43c6bb", "stop-opacity": "0" }, g);
    var step = W / (y.length - 1);
    var pts = y.map(function (v, i) { return [i * step, H - 6 - (v / max) * (H - 22)]; });
    var line = "M" + pts.map(function (p) { return p[0].toFixed(1) + "," + p[1].toFixed(1); }).join("L");
    el("path", { d: line + "L" + W + "," + H + "L0," + H + "Z", fill: "url(#heroFill)" }, svg);
    el("path", { d: line, fill: "none", stroke: "#6dd8cf", "stroke-width": "1.6", "vector-effect": "non-scaling-stroke" }, svg);
    host.insertBefore(svg, host.firstChild);
  }

  /* ---------- Explorer ---------- */
  var CAT_LABEL = { "cases": "Case reports", "live": "Live-streamed briefings", "president speech": "President / PM", "other": "Other" };
  function palette() {
    return isDark()
      ? { "cases": "#43c6bb", "live": "#6f9be8", "president speech": "#f07c63", "other": "#5d6d84", grid: "#22324a", text: "#93a2b7" }
      : { "cases": "#0b7a75", "live": "#3565c4", "president speech": "#cf4f36", "other": "#a9b3c1", grid: "#e3e8ef", text: "#5d6a7e" };
  }

  function setupExplorer(data) {
    var host = document.getElementById("chart");
    var select = document.getElementById("country-select");
    if (!host || !select) return;

    var codes = Object.keys(data.countries).sort(function (a, b) {
      return data.countries[a].name.localeCompare(data.countries[b].name);
    });
    codes.forEach(function (c) {
      var o = document.createElement("option");
      o.value = c;
      o.textContent = data.countries[c].name + " (" + data.countries[c].total.toLocaleString() + ")";
      select.appendChild(o);
    });

    var legend = document.getElementById("chart-legend");
    var tip = document.createElement("div");
    tip.className = "tip";

    function draw() {
      var pal = palette();
      var sel = select.value;
      var use = sel === "ALL" ? codes : [sel];
      var n = data.weeks.length;
      var stacks = data.categories.map(function (cat) {
        var arr = new Array(n).fill(0);
        use.forEach(function (c) {
          var s = data.countries[c].series[cat];
          for (var i = 0; i < n; i++) arr[i] += s[i];
        });
        return arr;
      });
      var tot = new Array(n).fill(0);
      stacks.forEach(function (s) { for (var i = 0; i < n; i++) tot[i] += s[i]; });
      var max = Math.max.apply(null, tot) || 1;
      var grand = tot.reduce(function (a, b) { return a + b; }, 0);

      // summary
      var peakI = tot.indexOf(Math.max.apply(null, tot));
      var firstI = tot.findIndex(function (v) { return v > 0; });
      document.getElementById("s-total").textContent = grand.toLocaleString();
      document.getElementById("s-peak").textContent = tot[peakI].toLocaleString();
      document.getElementById("s-peakdate").textContent = "Busiest week: " + fmtDate(data.weeks[peakI]);
      document.getElementById("s-first").textContent = fmtDate(data.weeks[firstI]);
      var casesShare = Math.round(100 * stacks[0].reduce(function (a, b) { return a + b; }, 0) / grand);
      document.getElementById("s-cases").textContent = casesShare + "%";

      // legend
      legend.innerHTML = "";
      data.categories.forEach(function (cat) {
        var s = document.createElement("span");
        s.innerHTML = '<i style="background:' + pal[cat] + '"></i>' + CAT_LABEL[cat];
        legend.appendChild(s);
      });

      // chart
      host.innerHTML = "";
      var W = 960, H = 320, m = { t: 12, r: 8, b: 30, l: 40 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b;
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Weekly COVID-19 announcements by category" });
      var bw = iw / n;

      // y grid
      var stepY = Math.pow(10, Math.floor(Math.log10(max)));
      if (max / stepY < 3) stepY /= 2;
      for (var v = 0; v <= max; v += stepY) {
        var yy = m.t + ih - (v / max) * ih;
        el("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy, stroke: pal.grid, "stroke-width": 1 }, svg);
        var t = el("text", { x: m.l - 8, y: yy + 4, "text-anchor": "end", fill: pal.text, "font-size": 11, "font-family": "IBM Plex Mono, monospace" }, svg);
        t.textContent = v;
      }
      // x labels: first week of each quarter
      data.weeks.forEach(function (w, i) {
        var mo = +w.slice(5, 7), day = +w.slice(8, 10);
        if ((mo === 1 || mo === 4 || mo === 7 || mo === 10) && day <= 7) {
          var x = m.l + i * bw + bw / 2;
          el("line", { x1: x, x2: x, y1: m.t + ih, y2: m.t + ih + 5, stroke: pal.text }, svg);
          var tx = el("text", { x: x, y: H - 8, "text-anchor": "middle", fill: pal.text, "font-size": 11, "font-family": "IBM Plex Mono, monospace" }, svg);
          tx.textContent = new Date(w + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
        }
      });

      // bars
      for (var i = 0; i < n; i++) {
        var base = m.t + ih;
        var grp = el("g", { "data-i": i }, svg);
        stacks.forEach(function (s, k) {
          if (!s[i]) return;
          var h = (s[i] / max) * ih;
          el("rect", { x: m.l + i * bw + 0.6, y: base - h, width: Math.max(bw - 1.2, 1), height: h, fill: pal[data.categories[k]] }, grp);
          base -= h;
        });
        el("rect", { x: m.l + i * bw, y: m.t, width: bw, height: ih, fill: "transparent", class: "hit", "data-i": i }, grp);
      }

      svg.addEventListener("mousemove", function (ev) {
        var r = ev.target.closest && ev.target.closest(".hit");
        if (!r) { tip.style.opacity = 0; return; }
        var i = +r.getAttribute("data-i");
        var rows = data.categories.map(function (cat, k) {
          return '<span style="color:' + pal[cat] + '">■</span> ' + CAT_LABEL[cat] + ": <b>" + stacks[k][i] + "</b>";
        }).join("<br>");
        tip.innerHTML = "Week of " + fmtDate(data.weeks[i]) + " · <b>" + tot[i] + "</b><br>" + rows;
        var box = host.getBoundingClientRect();
        var x = ev.clientX - box.left + 14;
        if (x > box.width - 230) x = ev.clientX - box.left - 230;
        tip.style.left = x + "px";
        tip.style.top = Math.max(0, ev.clientY - box.top - 40) + "px";
        tip.style.opacity = 1;
      });
      svg.addEventListener("mouseleave", function () { tip.style.opacity = 0; });

      host.appendChild(svg);
      host.appendChild(tip);
    }

    select.addEventListener("change", draw);
    window.__redrawExplorer = draw;
    draw();
  }

  document.addEventListener("DOMContentLoaded", function () {
    syncToggle();
    if (!document.getElementById("hero-curve") && !document.getElementById("chart")) return;
    fetch(DATA_URL)
      .then(function (r) { return r.json(); })
      .then(function (data) { drawHero(data); setupExplorer(data); })
      .catch(function () {
        var c = document.getElementById("chart");
        if (c) c.innerHTML = '<p class="explorer-note">The interactive chart needs the site to be served over http (e.g. GitHub Pages or <code>python3 -m http.server</code>).</p>';
      });
  });
})();
