/* When the Markets Get COVID — site behavior
   - BibTeX copy button
   - interactive Plotly charts (<div class="plot" data-src="assets/plots/x.json">)
   - weekly announcements explorer (announcements.html)
   - LDA topic-model viewer (topics.html) */

(function () {
  var INK = "#211d1a", GRAY = "#766e62", GRID = "#ece5d8", ACCENT = "#c2542d", SLATE = "#3b6e8f";
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- BibTeX copy ---------- */
  document.addEventListener("click", function (e) {
    var c = e.target.closest(".copy-btn");
    if (!c) return;
    var target = document.querySelector(c.dataset.copyTarget);
    if (!target || !navigator.clipboard) return;
    navigator.clipboard.writeText(target.innerText.trim()).then(function () {
      var original = c.textContent;
      c.textContent = "Copied";
      setTimeout(function () { c.textContent = original; }, 1500);
    });
  });

  /* ---------- Plotly charts ---------- */
  var COLORWAY = ["#c2542d", "#3b6e8f", "#211d1a", "#8a9a5b", "#b88a2e", "#7a5c8e", "#5e8c8a",
                  "#a8574f", "#6b7fa3", "#9c7b5b", "#4f7d5c", "#c98a6b", "#56647a", "#a39a3c"];

  function styleAxis(ax) {
    ax = ax || {};
    ax.gridcolor = GRID;
    ax.zerolinecolor = "#d9cfbf";
    ax.linecolor = "#d9cfbf";
    ax.tickfont = { size: 11, color: GRAY };
    if (ax.title && ax.title.text) ax.title.font = { size: 12, color: GRAY };
    return ax;
  }

  function renderPlot(el) {
    fetch(el.dataset.src)
      .then(function (r) { return r.json(); })
      .then(function (fig) {
        var L = fig.layout || {};
        Object.keys(L).forEach(function (k) {
          if (/^[xy]axis\d*$/.test(k)) L[k] = styleAxis(L[k]);
        });
        L.xaxis = styleAxis(L.xaxis);
        L.yaxis = styleAxis(L.yaxis);
        L.font = { family: "Inter, -apple-system, sans-serif", size: 12, color: INK };
        L.paper_bgcolor = "rgba(0,0,0,0)";
        L.plot_bgcolor = "rgba(0,0,0,0)";
        L.colorway = COLORWAY;
        L.hovermode = L.hovermode || "closest";
        L.hoverlabel = { bgcolor: "#fffefc", bordercolor: "#e8e0d3", font: { color: INK, size: 12 } };
        L.legend = { orientation: "h", x: 0, y: -0.14, font: { size: 11, color: GRAY } };
        L.margin = { l: 60, r: 30, t: (L.annotations && L.annotations.length) ? 40 : 16, b: 40 };
        if (el.dataset.legend === "right") L.legend = { orientation: "v", x: 1.02, y: 1, font: { size: 11, color: GRAY } };
        if (el.dataset.legend === "none") L.showlegend = false;
        (L.annotations || []).forEach(function (a) { a.font = { size: 12, color: INK }; });
        Plotly.newPlot(el, fig.data, L, {
          responsive: true,
          displaylogo: false,
          modeBarButtonsToRemove: ["select2d", "lasso2d", "autoScale2d", "toggleSpikelines"]
        });
      })
      .catch(function () {
        el.innerHTML = '<p class="plot-hint" style="padding:20px;">This chart needs the site served over http (GitHub Pages, or <code>python3 -m http.server</code> locally).</p>';
      });
  }

  /* ---------- Announcements explorer ---------- */
  var CAT_LABEL = { "cases": "Case reports", "live": "Live-streamed briefings", "president speech": "President / PM", "other": "Other" };
  var CAT_COLOR = { "cases": ACCENT, "live": SLATE, "president speech": "#b88a2e", "other": "#cfc5b4" };

  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function fmtDate(iso) {
    return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }

  function setupExplorer(data) {
    var host = document.getElementById("chart");
    var select = document.getElementById("country-select");
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
    data.categories.forEach(function (cat) {
      var s = document.createElement("span");
      s.innerHTML = '<i style="background:' + CAT_COLOR[cat] + '"></i>' + CAT_LABEL[cat];
      legend.appendChild(s);
    });
    var tip = document.createElement("div");
    tip.className = "tip";

    function draw() {
      var use = select.value === "ALL" ? codes : [select.value];
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
      var peakI = tot.indexOf(max);
      var firstI = tot.findIndex(function (v) { return v > 0; });
      document.getElementById("s-total").textContent = grand.toLocaleString();
      document.getElementById("s-peak").textContent = max.toLocaleString();
      document.getElementById("s-peakdate").textContent = "in the busiest week (" + fmtDate(data.weeks[peakI]) + ")";
      document.getElementById("s-first").textContent = fmtDate(data.weeks[firstI]);
      document.getElementById("s-cases").textContent =
        Math.round(100 * stacks[0].reduce(function (a, b) { return a + b; }, 0) / grand) + "%";

      host.innerHTML = "";
      var W = 960, H = 300, m = { t: 10, r: 8, b: 28, l: 40 };
      var iw = W - m.l - m.r, ih = H - m.t - m.b, bw = iw / n;
      var svg = el("svg", { viewBox: "0 0 " + W + " " + H, role: "img", "aria-label": "Weekly COVID-19 announcements by category" });
      var stepY = Math.pow(10, Math.floor(Math.log10(max)));
      if (max / stepY < 3) stepY /= 2;
      for (var v = 0; v <= max; v += stepY) {
        var yy = m.t + ih - (v / max) * ih;
        el("line", { x1: m.l, x2: W - m.r, y1: yy, y2: yy, stroke: GRID }, svg);
        el("text", { x: m.l - 8, y: yy + 4, "text-anchor": "end", fill: GRAY, "font-size": 11 }, svg).textContent = v;
      }
      data.weeks.forEach(function (w, i) {
        var mo = +w.slice(5, 7), day = +w.slice(8, 10);
        if ((mo === 1 || mo === 4 || mo === 7 || mo === 10) && day <= 7) {
          var x = m.l + i * bw + bw / 2;
          el("text", { x: x, y: H - 6, "text-anchor": "middle", fill: GRAY, "font-size": 11 }, svg).textContent =
            new Date(w + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
        }
      });
      for (var i = 0; i < n; i++) {
        var base = m.t + ih;
        var g = el("g", {}, svg);
        stacks.forEach(function (s, k) {
          if (!s[i]) return;
          var h = (s[i] / max) * ih;
          el("rect", { x: m.l + i * bw + 0.6, y: base - h, width: Math.max(bw - 1.2, 1), height: h, fill: CAT_COLOR[data.categories[k]] }, g);
          base -= h;
        });
        el("rect", { x: m.l + i * bw, y: m.t, width: bw, height: ih, fill: "transparent", class: "hit", "data-i": i }, g);
      }
      svg.addEventListener("mousemove", function (ev) {
        var r = ev.target.closest && ev.target.closest(".hit");
        if (!r) { tip.style.opacity = 0; return; }
        var i = +r.getAttribute("data-i");
        tip.innerHTML = "Week of " + fmtDate(data.weeks[i]) + " &middot; <b>" + tot[i] + "</b><br>" +
          data.categories.map(function (cat, k) {
            return '<span style="color:' + CAT_COLOR[cat] + '">&#9632;</span> ' + CAT_LABEL[cat] + ": " + stacks[k][i];
          }).join("<br>");
        var box = host.getBoundingClientRect();
        var x = ev.clientX - box.left + 14;
        if (x > box.width - 220) x = ev.clientX - box.left - 220;
        tip.style.left = x + "px";
        tip.style.top = Math.max(0, ev.clientY - box.top - 40) + "px";
        tip.style.opacity = 1;
      });
      svg.addEventListener("mouseleave", function () { tip.style.opacity = 0; });
      host.appendChild(svg);
      host.appendChild(tip);
    }
    select.addEventListener("change", draw);
    draw();
  }

  /* ---------- LDA viewer ---------- */
  function setupLda() {
    var frame = document.getElementById("lda-iframe");
    var buttons = document.querySelectorAll(".lda-controls button");
    function show(btn) {
      buttons.forEach(function (b) { b.classList.toggle("active", b === btn); });
      frame.src = "assets/lda/" + btn.dataset.country + ".html";
    }
    buttons.forEach(function (b) { b.addEventListener("click", function () { show(b); }); });
    if (buttons.length) show(buttons[0]);

    // LDAvis draws at a fixed 1220x900 px; scale it to the container (never below 55%, then scroll)
    var wrap = frame.parentNode, W = 1220, H = 900;
    function fit() {
      var s = Math.max(0.55, Math.min(1, wrap.clientWidth / W));
      frame.style.transform = "scale(" + s + ")";
      frame.style.transformOrigin = "0 0";
      wrap.style.height = Math.ceil(H * s) + "px";
      wrap.style.overflowX = W * s > wrap.clientWidth + 1 ? "auto" : "hidden";
    }
    fit();
    window.addEventListener("resize", fit);
  }

  document.addEventListener("DOMContentLoaded", function () {
    if (window.Plotly) document.querySelectorAll(".plot[data-src]").forEach(renderPlot);
    if (document.getElementById("chart")) {
      fetch("assets/data/announcements_weekly.json")
        .then(function (r) { return r.json(); })
        .then(setupExplorer)
        .catch(function () {
          document.getElementById("chart").innerHTML = '<p class="plot-hint">The explorer needs the site served over http.</p>';
        });
    }
    if (document.getElementById("lda-iframe")) setupLda();
    if (window.renderMathInElement) {
      renderMathInElement(document.body, {
        delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\(", right: "\\)", display: false }],
        throwOnError: false
      });
    }
  });
})();
