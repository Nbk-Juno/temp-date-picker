(function () {
  "use strict";

  // ── Pure helpers (also used by tests) ───────────────────────────
  function buildDays(startDate, numDays) {
    const [y, m, d] = startDate.split("-").map(Number);
    const out = [];
    for (let i = 0; i < numDays; i++) {
      const dt = new Date(y, m - 1, d + i);
      const key = dt.getFullYear() + "-" + String(dt.getMonth() + 1).padStart(2, "0") + "-" + String(dt.getDate()).padStart(2, "0");
      out.push({ key, d: dt });
    }
    return out;
  }

  function summarize(people, days, preferences) {
    const inPersonIds = new Set(preferences.filter(p => p.inPerson).map(p => p.id));
    const by = {};
    days.forEach(({ key }) => (by[key] = []));
    const prefCount = {};
    preferences.forEach(p => (prefCount[p.id] = 0));
    people.forEach(p => {
      if (p.pref in prefCount) prefCount[p.pref]++;
      (p.dates || []).forEach(k => { if (by[k]) by[k].push(p); });
    });
    const perDay = days.map(x => ({
      key: x.key, d: x.d, people: by[x.key], count: by[x.key].length,
      inPerson: by[x.key].filter(p => inPersonIds.has(p.pref)).length,
    }));
    const ranked = perDay.filter(x => x.count).sort((a, b) => b.count - a.count || a.d - b.d);
    return { total: people.length, prefCount, perDay, ranked, max: ranked.length ? ranked[0].count : 0 };
  }

  if (typeof window === "undefined") { module.exports = { buildDays, summarize }; return; }

  // ── Setup ───────────────────────────────────────────────────────
  const C = window.PICKER_CONFIG;
  const $ = id => document.getElementById(id);
  const DAYS = buildDays(C.startDate, C.numDays);
  const PREF = Object.fromEntries(C.preferences.map(p => [p.id, p]));
  const DEMO = !C.apiUrl;
  const STORE_KEY = "picker:" + C.eventId;
  const fmtShort = d => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtRow = d => d.toLocaleDateString("en-US", { weekday: "short", month: "numeric", day: "numeric" });

  document.title = C.title;
  $("title").textContent = C.title;
  $("eyebrow").textContent = C.eyebrow + " · " + fmtMD(DAYS[0].d) + " – " + fmtMD(DAYS[DAYS.length - 1].d);
  $("demo").hidden = !DEMO;
  function fmtMD(d) { return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }); }

  const state = { step: 1, name: "", email: "", pref: "", dates: new Set() };

  // Prefill from this browser's last submission
  const saved = safeGet(STORE_KEY + ":me");
  if (saved) {
    $("name").value = saved.name || "";
    $("email").value = saved.email || "";
    state.pref = saved.pref || "";
    (saved.dates || []).forEach(k => state.dates.add(k));
  }

  // ── Preferences ────────────────────────────────────────────────
  const ICONS = {
    pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    video: '<rect x="3" y="5" width="13" height="14" rx="2"/><path d="M16 10l5-3v10l-5-3"/>',
    swap: '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
  };
  C.preferences.forEach(p => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "pref"; b.dataset.v = p.id; b.id = "pref-" + p.id;
    b.innerHTML = '<span class="glyph"><svg viewBox="0 0 24 24">' + (ICONS[p.icon] || ICONS.swap) + '</svg></span><span><b></b><small></small></span>';
    b.querySelector("b").textContent = p.label;
    b.querySelector("small").textContent = p.hint || "";
    b.addEventListener("click", () => { state.pref = p.id; syncPrefs(); setTimeout(() => show(3), 180); });
    $("prefs").appendChild(b);
  });
  function syncPrefs() {
    document.querySelectorAll(".pref").forEach(x => x.setAttribute("aria-pressed", x.dataset.v === state.pref ? "true" : "false"));
  }

  // ── Calendar ───────────────────────────────────────────────────
  // Group by Mon–Sun weeks
  const weeks = [];
  DAYS.forEach((day, i) => {
    const mondayFirst = (day.d.getDay() + 6) % 7;
    if (i === 0 || mondayFirst === 0) weeks.push([]);
    weeks[weeks.length - 1].push(day);
  });
  weeks.forEach(wk => {
    const w = document.createElement("div"); w.className = "week";
    const lbl = document.createElement("div"); lbl.className = "weeklabel";
    lbl.textContent = "Week of " + fmtMD(wk[0].d);
    const grid = document.createElement("div"); grid.className = "days";
    wk.forEach(({ key, d }) => {
      const btn = document.createElement("button");
      btn.type = "button"; btn.className = "day"; btn.id = "d-" + key;
      btn.setAttribute("aria-label", fmtShort(d));
      btn.innerHTML = '<span class="dow"></span><span class="num"></span><span class="mon"></span>';
      btn.children[0].textContent = d.toLocaleDateString("en-US", { weekday: "short" });
      btn.children[1].textContent = d.getDate();
      btn.children[2].textContent = d.toLocaleDateString("en-US", { month: "short" });
      btn.addEventListener("click", () => { state.dates.has(key) ? state.dates.delete(key) : state.dates.add(key); syncDays(); });
      grid.appendChild(btn);
    });
    w.append(lbl, grid); $("calendar").appendChild(w);
  });
  function syncDays() {
    DAYS.forEach(({ key }) => $("d-" + key).setAttribute("aria-pressed", state.dates.has(key) ? "true" : "false"));
    const n = state.dates.size;
    $("count").textContent = n + (n === 1 ? " day" : " days");
    $("err3").textContent = "";
  }
  const isWeekend = d => d.getDay() === 0 || d.getDay() === 6;
  $("q-wd").onclick = () => { DAYS.forEach(x => { if (!isWeekend(x.d)) state.dates.add(x.key); }); syncDays(); };
  $("q-we").onclick = () => { DAYS.forEach(x => { if (isWeekend(x.d)) state.dates.add(x.key); }); syncDays(); };
  $("q-clr").onclick = () => { state.dates.clear(); syncDays(); };

  // ── Navigation ─────────────────────────────────────────────────
  function show(step) {
    state.step = step;
    [1, 2, 3, 4].forEach(s => ($("s" + s).hidden = s !== step));
    $("progress").hidden = step === 4;
    [...$("progress").children].forEach((el, i) => el.classList.toggle("on", i < step));
    $("bar").hidden = step === 4;
    $("back").hidden = step === 1;
    $("count").hidden = step !== 3;
    $("next").hidden = step === 2;
    $("next").textContent = step === 3 ? "Submit" : "Next";
    if (step === 4) startPolling(); else stopPolling();
    window.scrollTo(0, 0);
  }

  const emailOk = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
  $("next").addEventListener("click", () => {
    if (state.step === 1) {
      state.name = $("name").value.trim();
      state.email = $("email").value.trim().toLowerCase();
      if (!state.name) { $("err1").textContent = "Add your name so the group knows who picked what."; $("name").focus(); return; }
      if (!emailOk(state.email)) { $("err1").textContent = "That email doesn't look right. Check for typos."; $("email").focus(); return; }
      $("err1").textContent = "";
      syncPrefs(); show(2);
    } else if (state.step === 3) {
      if (!state.dates.size) { $("err3").textContent = "Pick at least one day that works for you."; return; }
      submit();
    }
  });
  $("back").addEventListener("click", () => show(Math.max(1, state.step - 1)));
  $("peek").addEventListener("click", () => { $("thanks").hidden = true; $("notice").hidden = true; show(4); });
  $("again").addEventListener("click", () => { $("thanks").hidden = true; $("notice").hidden = true; show(1); });
  $("refresh").addEventListener("click", loadResults);

  // ── Data ───────────────────────────────────────────────────────
  async function submit() {
    const btn = $("next");
    btn.disabled = true; btn.textContent = "Saving…";
    const body = { event: C.eventId, name: state.name, email: state.email, pref: state.pref, dates: [...state.dates].sort() };
    let notice = "";
    try {
      if (DEMO) {
        const all = safeGet(STORE_KEY + ":demo") || {};
        all[body.email] = { name: body.name, pref: body.pref, dates: body.dates };
        safeSet(STORE_KEY + ":demo", all);
      } else {
        // text/plain keeps this a "simple" request, so Apps Script needs no CORS preflight.
        const res = await fetch(C.apiUrl, { method: "POST", body: JSON.stringify(body) });
        const out = await res.json();
        if (!out.ok) throw new Error(out.error || "Save failed");
      }
      safeSet(STORE_KEY + ":me", body);
    } catch (e) {
      notice = "Your answers didn't save (" + (e.message || "network error") + "). Tap Change my answers and submit again.";
    }
    btn.disabled = false;
    $("tname").textContent = state.name.split(" ")[0];
    $("thanks").hidden = !!notice;
    $("notice").hidden = !notice;
    $("notice").textContent = notice;
    show(4);
  }

  async function loadResults() {
    try {
      let people;
      if (DEMO) {
        people = Object.values(safeGet(STORE_KEY + ":demo") || {});
      } else {
        const res = await fetch(C.apiUrl + "?event=" + encodeURIComponent(C.eventId));
        const out = await res.json();
        if (!out.ok) throw new Error(out.error);
        people = out.people;
      }
      render(summarize(people, DAYS, C.preferences));
    } catch (e) {
      $("top").replaceChildren(el("div", "empty", "Couldn't load results. Check your connection and tap Refresh results."));
    }
  }

  let timer = null;
  function startPolling() { loadResults(); stopPolling(); timer = setInterval(loadResults, 30000); }
  function stopPolling() { if (timer) clearInterval(timer); timer = null; }

  // ── Render results ─────────────────────────────────────────────
  function el(tag, cls, text) { const x = document.createElement(tag); if (cls) x.className = cls; if (text != null) x.textContent = text; return x; }

  function render(s) {
    const stats = [el("span", "stat", s.total + (s.total === 1 ? " response" : " responses"))];
    C.preferences.forEach(p => stats.push(el("span", "stat", p.label + " " + (s.prefCount[p.id] || 0))));
    $("stats").replaceChildren(...stats);

    const top = $("top"); top.replaceChildren();
    if (!s.total) top.appendChild(el("div", "empty", "No responses yet. Be the first: tap Change my answers to add yours."));
    s.ranked.slice(0, 3).forEach((x, i) => {
      const row = el("div", "toprow");
      row.appendChild(el("span", "rank", String(i + 1)));
      const meta = el("div", "meta");
      meta.appendChild(el("b", null, fmtShort(x.d)));
      meta.appendChild(el("span", "names", x.count + " of " + s.total + " can make it (" + Math.round(x.count / s.total * 100) + "%) · " + x.inPerson + " open to in-person"));
      meta.appendChild(el("span", "names", x.people.map(p => p.name).join(", ")));
      row.appendChild(meta); top.appendChild(row);
    });

    const all = $("all"); all.replaceChildren();
    s.perDay.forEach(x => {
      const row = el("div", "rowb" + (x.count && x.count === s.max ? " best" : ""));
      row.appendChild(el("span", "d", fmtRow(x.d)));
      const tr = el("div", "track"), f = el("div", "fill");
      f.style.width = (s.total ? x.count / s.total * 100 : 0) + "%";
      tr.appendChild(f); row.appendChild(tr);
      row.appendChild(el("span", "n", String(x.count)));
      if (x.count) row.appendChild(el("span", "names", x.people.map(p => p.name + " (" + (PREF[p.pref] ? PREF[p.pref].label : p.pref) + ")").join(", ")));
      all.appendChild(row);
    });
  }

  function safeGet(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (_) { return null; } }
  function safeSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }

  syncDays();
  show(1);
})();
