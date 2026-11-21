(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;

  /* Tiny DOM helper. Text goes through textContent, so content can't inject HTML. */
  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === "" || value === false) continue;
        if (key === "text") node.textContent = value;
        else if (key.startsWith("on")) node.addEventListener(key.slice(2), value);
        else node.setAttribute(key, value === true ? "" : value);
      }
    }
    kids.flat(Infinity).forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const initials = (name = "") =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const paragraphs = (text = "") => text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const isMail = (url) => /^mailto:/i.test(url || "");

  /* Image with a fallback: no file set, or a file that fails to load, shows initials instead. */
  function media(src, alt, fallback, cls) {
    const placeholder = () => h("span", { class: "media-fallback", "aria-hidden": "true", text: fallback });
    const wrap = h("div", { class: "media " + (cls || "") });
    wrap.append(src
      ? h("img", { src, alt, loading: "lazy", onerror: (e) => e.currentTarget.replaceWith(placeholder()) })
      : placeholder());
    return wrap;
  }

  const ICON_TEXT = { github: "GH", linkedin: "in", email: "@", instagram: "IG", x: "X", telegram: "TG", scholar: "GS" };

  function chip(l) {
    const attrs = isMail(l.url) ? {} : { target: "_blank", rel: "noopener noreferrer" };
    return h("a", {
      class: "chip", href: l.url, ...attrs,
      "data-track": "social-click", "data-title": l.label
    }, h("span", { class: "chip-icon", "aria-hidden": "true", text: ICON_TEXT[l.icon] || "↗" }), l.label);
  }

  const link = (url, label, track, title) =>
    url
      ? h("a", { href: url, target: "_blank", rel: "noopener noreferrer", "data-track": track, "data-title": title, text: label })
      : null;

  /* ---------- Analytics (GoatCounter, cookie-free) ---------- */
  function loadAnalytics(code) {
    if (!code) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", `https://${code}.goatcounter.com/count`);
    document.head.append(s);
  }

  /* Counts a named event such as a CV download or a like. Pageviews are counted automatically. */
  function track(name, title) {
    try {
      if (window.goatcounter && typeof window.goatcounter.count === "function") {
        window.goatcounter.count({ path: name, title: title || name, event: true });
      }
    } catch (_) { /* analytics must never break the page */ }
  }

  document.addEventListener("click", (event) => {
    const el = event.target.closest("[data-track]");
    if (el) track(el.dataset.track, el.dataset.title);
  });

  /* ---------- Pages in the navigation. A page is hidden when its `has` check fails. ---------- */
  const hasAbout = (d) => {
    const a = d.about || {};
    return !!(paragraphs(a.body).length || (a.interests || []).length || (d.gallery || []).length);
  };

  const NAV = [
    { id: "home", href: "index.html", label: "Home" },
    { id: "about", href: "about.html", label: "About", has: hasAbout },
    { id: "cv", href: "cv.html", label: "CV", has: (d) => (d.cv || []).length || (d.skills || []).length },
    { id: "research", href: "research.html", label: "Research", has: (d) => (d.research || []).length },
    { id: "teaching", href: "teaching.html", label: "Teaching", has: (d) => (d.teaching || []).length },
    { id: "projects", href: "projects.html", label: "Projects", has: (d) => (d.projects || []).length },
    { id: "honors", href: "honors.html", label: "Honors", has: (d) => (d.honors || []).length },
    { id: "team", href: "team.html", label: "Team", has: (d) => (d.team || []).length },
    { id: "contact", href: "contact.html", label: "Contact" }
  ];

  function renderNav(d, current) {
    const items = NAV.filter((n) => n.id === "home" || !n.has || n.has(d));
    $("#links").replaceChildren(...items.map((n) =>
      h("a", {
        href: n.href,
        text: n.label,
        class: n.id === current ? "active" : null,
        "aria-current": n.id === current ? "page" : null
      })));
  }

  /* ---------- Meta tags and structured data ---------- */
  function setMeta(key, content, attr = "name") {
    let tag = document.head.querySelector(`meta[${attr}="${key}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute(attr, key);
      document.head.append(tag);
    }
    tag.setAttribute("content", content);
  }

  function applyMeta(d, current) {
    const p = d.profile;
    const page = NAV.find((n) => n.id === current);
    const title = current === "home" ? `${p.name} | ${p.title}` : `${page ? page.label : ""} | ${p.name}`;
    document.title = title;
    setMeta("description", p.intro);
    setMeta("og:title", title, "property");
    setMeta("og:description", p.intro, "property");
    if (p.photo) setMeta("og:image", new URL(p.photo, location.href).href, "property");

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: p.name,
      jobTitle: p.title,
      url: location.origin + location.pathname.replace(/[^/]*$/, ""),
      sameAs: (d.links || []).map((l) => l.url).filter((u) => u && !isMail(u))
    });
    document.head.append(ld);
  }

  function renderFooter(d) {
    $("#footer").replaceChildren(
      h("div", { class: "foot" },
        h("span", { text: `© ${new Date().getFullYear()} ${d.profile.name}` }),
        h("span", null, (d.links || []).filter((l) => l.url).map((l) => chip(l)))));
  }

  /* ---------- Behaviour: reveal on scroll, GitHub stars ---------- */
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); revealObserver.unobserve(en.target); }
      }), { threshold: 0.12 })
    : { observe: (el) => el.classList.add("in"), unobserve() {} };

  function enhance() {
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
  }

  /* GitHub's public API gives star counts without a token. Cached per browser session. */
  async function fillStars() {
    for (const el of document.querySelectorAll("[data-repo]")) {
      const repo = el.dataset.repo;
      const cacheKey = "stars:" + repo;
      let count = null;
      try { count = sessionStorage.getItem(cacheKey); } catch (_) {}
      if (count === null) {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo}`, {
            headers: { Accept: "application/vnd.github+json" }
          });
          if (res.ok) {
            count = String((await res.json()).stargazers_count);
            try { sessionStorage.setItem(cacheKey, count); } catch (_) {}
          }
        } catch (_) {}
      }
      if (count !== null) el.textContent = `★ ${count}`;
    }
  }

  /* ---------- Load and render one page ---------- */
  async function start(current) {
    let data;
    try {
      const res = await fetch("content.json", { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      data = await res.json();
    } catch (err) {
      $("#top").replaceChildren(h("div", { class: "wrap" }, h("p", { class: "error", text: "Content could not be loaded." })));
      console.error(err);
      return;
    }

    applyMeta(data, current);
    loadAnalytics(data.analytics && data.analytics.goatcounter);
    $("#brand").textContent = data.profile.name;
    renderNav(data, current);

    const render = window.Site.pages[current];
    const nodes = render ? render(data) : [];
    $("#top").replaceChildren(...nodes.filter(Boolean));

    renderFooter(data);
    enhance();
    fillStars();
  }

  /* ---------- Theme toggle ---------- */
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (_) {}

  $("#theme").addEventListener("click", () => {
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const current = root.dataset.theme || (systemDark ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (_) {}
  });

  /* ---------- Mobile menu ---------- */
  const burger = $("#burger");
  const menu = $("#links");
  burger.addEventListener("click", () => {
    const open = menu.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(open));
  });
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) {
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }
  });

  window.Site = { h, media, initials, paragraphs, link, chip, track, slug, start, pages: {} };
})();
