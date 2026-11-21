(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const root = document.documentElement;

  /* Tiny DOM helper. Text always goes through textContent, so content can't inject HTML. */
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
    kids.flat().forEach((child) => {
      if (child === null || child === undefined || child === false) return;
      node.append(child.nodeType ? child : document.createTextNode(String(child)));
    });
    return node;
  }

  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const initials = (name = "") =>
    name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  const paragraphs = (text = "") => text.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const isMail = (url) => /^mailto:/i.test(url);

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

  const section = (id, title, ...kids) =>
    h("section", { id }, h("div", { class: "wrap" }, h("h2", { text: title }), ...kids));

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

  function applyMeta(d) {
    const p = d.profile;
    document.title = `${p.name} | ${p.title}`;
    $("#brand").textContent = p.name;
    setMeta("description", p.intro);
    setMeta("og:title", document.title, "property");
    setMeta("og:description", p.intro, "property");
    if (p.photo) setMeta("og:image", new URL(p.photo, location.href).href, "property");

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: p.name,
      jobTitle: p.title,
      url: location.origin + location.pathname,
      sameAs: (d.links || []).map((l) => l.url).filter((u) => u && !isMail(u))
    });
    document.head.append(ld);
  }

  /* ---------- Sections. Each returns null when it has no content, so it is hidden. ---------- */
  function renderHero(d) {
    const p = d.profile;
    const socials = (d.links || []).filter((l) => l.url);
    const stats = d.stats || [];
    return h("section", { class: "hero" },
      h("div", { class: "wrap" },
        h("div", { class: "hero-inner" },
          media(p.photo, p.name, initials(p.name), "avatar"),
          h("div", null,
            h("h1", { text: p.name }),
            h("div", { class: "sub", text: p.title }),
            p.location ? h("div", { class: "muted small", text: p.location }) : null,
            h("p", { text: p.intro }),
            h("div", { class: "btns" },
              p.cvUrl ? h("a", { class: "btn primary", href: p.cvUrl, target: "_blank", rel: "noopener", "data-track": "download-cv", text: "Download CV" }) : null,
              h("a", { class: p.cvUrl ? "btn" : "btn primary", href: "#contact", text: "Get in touch" })),
            socials.length ? h("div", { class: "chips" }, socials.map((l) => chip(l))) : null)),
        stats.length
          ? h("div", { class: "stats" }, stats.map((s) =>
              h("div", { class: "stat reveal" }, h("b", { text: s.value }), h("span", { text: s.label }))))
          : null));
  }

  function renderAbout(d) {
    const a = d.about || {};
    const paras = paragraphs(a.body);
    const interests = a.interests || [];
    if (!paras.length && !interests.length) return null;
    return section("about", "About",
      paras.length ? h("div", { class: "prose" }, paras.map((t) => h("p", { text: t }))) : null,
      interests.length
        ? h("div", { class: "interests" },
            h("h3", { class: "subhead", text: "Interests" }),
            h("div", null, interests.map((t) => h("span", { class: "tag", text: t }))))
        : null);
  }

  function renderHonors(d) {
    const items = d.honors || [];
    if (!items.length) return null;
    return section("honors", "Honors",
      h("ul", { class: "honor-list" }, items.map((x) =>
        h("li", { class: "reveal" },
          h("span", { class: "honor-title", text: x.title }),
          x.year ? h("span", { class: "badge", text: x.year }) : null))));
  }

  const CV_ORDER = ["Education", "Research", "Work", "Teaching"];

  function renderCV(d) {
    const entries = d.cv || [];
    const groups = [...CV_ORDER, "Other"]
      .map((c) => [c, entries.filter((e) => (e.category || "Other") === c)])
      .filter(([, items]) => items.length);
    const skills = d.skills || [];
    if (!groups.length && !skills.length) return null;

    return section("cv", "CV",
      groups.map(([name, items]) =>
        h("div", null,
          h("h3", { class: "subhead", text: name }),
          h("div", { class: "timeline" }, items.map((e) =>
            h("div", { class: "tl-item reveal" },
              h("div", { class: "tl-date", text: [e.dateStart, e.dateEnd].filter(Boolean).join(" – ") }),
              h("h3", { text: e.title }),
              e.institution ? h("div", { class: "org", text: e.institution }) : null,
              e.description ? h("p", { class: "muted", text: e.description }) : null))))),
      skills.length
        ? h("div", null,
            h("h3", { class: "subhead", text: "Skills" }),
            h("div", { class: "skill-groups" }, skills.map((g) =>
              h("div", { class: "skill-group" },
                h("div", { class: "muted small", text: g.group }),
                h("div", null, (g.items || []).map((t) => h("span", { class: "tag", text: t })))))))
        : null);
  }

  function renderResearch(d) {
    const items = d.research || [];
    if (!items.length) return null;
    return section("research", "Research",
      items.map((p) =>
        h("article", { class: "item reveal" },
          p.status ? h("span", { class: "badge", text: p.status }) : null,
          h("h3", { text: p.title }),
          p.coauthors ? h("div", { class: "muted", text: p.coauthors }) : null,
          p.abstract ? h("p", { class: "muted", text: p.abstract }) : null,
          h("div", { class: "item-links" },
            link(p.pdfUrl, "PDF", "paper-pdf", p.title),
            link(p.codeUrl, "Code", "paper-code", p.title)))));
  }

  function renderTeaching(d) {
    const items = d.teaching || [];
    if (!items.length) return null;
    return section("teaching", "Teaching",
      items.map((t) =>
        h("article", { class: "item reveal" },
          t.semester ? h("span", { class: "badge", text: t.semester }) : null,
          h("h3", { text: t.title }),
          t.description ? h("p", { class: "muted", text: t.description }) : null,
          h("div", { class: "item-links" }, link(t.materialsUrl, "Materials", "teaching-materials", t.title)))));
  }

  /* A like is counted as a GoatCounter event (you see it in the dashboard). Each browser can like once. */
  function projectCard(p) {
    const key = p.repo || p.name;
    const liked = () => localStorage.getItem("liked:" + key) === "1";

    const likeBtn = h("button", {
      class: "like", type: "button",
      text: liked() ? "♥ Liked" : "♡ Like",
      disabled: liked()
    });
    likeBtn.addEventListener("click", () => {
      try { localStorage.setItem("liked:" + key, "1"); } catch (_) {}
      track("like-" + slug(key), "Like: " + p.name);
      likeBtn.textContent = "♥ Liked";
      likeBtn.disabled = true;
    });

    return h("article", { class: "card reveal" },
      media(p.image, p.name, initials(p.name), "card-media"),
      h("h3", { text: p.name }),
      h("p", { text: p.description }),
      h("div", null, (p.stack || []).map((t) => h("span", { class: "tag", text: t }))),
      h("div", { class: "card-actions" },
        p.repo ? h("a", { href: `https://github.com/${p.repo}`, target: "_blank", rel: "noopener noreferrer", "data-track": "project-code", "data-title": p.name, text: "Code" }) : null,
        link(p.link, "Demo ↗", "project-click", p.name),
        p.repo ? h("span", { class: "stars muted", "data-repo": p.repo, text: "★" }) : null,
        likeBtn));
  }

  function renderProjects(d) {
    const items = d.projects || [];
    if (!items.length) return null;
    return section("projects", "Projects", h("div", { class: "grid" }, items.map((p) => projectCard(p))));
  }

  function renderTeam(d) {
    const items = d.team || [];
    if (!items.length) return null;
    return section("team", "Team", h("div", { class: "grid" }, items.map((m) =>
      h("article", { class: "card reveal" },
        media(m.photo, m.name, initials(m.name), "avatar avatar-sm"),
        h("h3", { text: m.name }),
        m.role ? h("p", { text: m.role }) : null,
        link(m.url, "Profile ↗", "team-profile", m.name)))));
  }

  function renderContact(d) {
    const p = d.profile;
    const copy = h("button", {
      class: "btn ghost", type: "button", "data-track": "copy-email", text: "Copy email",
      onclick: (e) => {
        if (navigator.clipboard) navigator.clipboard.writeText(p.email).catch(() => {});
        e.currentTarget.textContent = "Copied";
      }
    });

    const form = h("form", {
      id: "contact-form",
      onsubmit: (event) => {
        event.preventDefault();
        const data = new FormData(event.target);
        const name = data.get("name");
        const subject = data.get("subject") || `Message from ${name}`;
        const body = `${data.get("message")}\n\n— ${name} (${data.get("email")})`;
        track("contact-submit");
        window.location.href =
          `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      }
    },
      h("input", { name: "name", placeholder: "Your name", required: true, autocomplete: "name" }),
      h("input", { name: "email", type: "email", placeholder: "Your email", required: true, autocomplete: "email" }),
      h("input", { name: "subject", placeholder: "Subject" }),
      h("textarea", { name: "message", placeholder: "Your message", required: true }),
      h("button", { class: "btn primary", type: "submit", text: "Send message" }));

    return section("contact", "Contact",
      h("p", { class: "muted", text: "Send a message and it opens in your email app." }),
      form,
      p.email
        ? h("div", { class: "contact-email" },
            h("span", { class: "muted", text: "Or email " }),
            h("a", { href: `mailto:${p.email}`, text: p.email }),
            copy)
        : null);
  }

  function renderFooter(d) {
    $("#footer").replaceChildren(
      h("div", { class: "foot" },
        h("span", { text: `© ${new Date().getFullYear()} ${d.profile.name}` }),
        h("span", null, (d.links || []).filter((l) => l.url).map((l) => chip(l)))));
  }

  /* ---------- Behaviour: reveal on scroll, active nav link, GitHub stars ---------- */
  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add("in"); revealObserver.unobserve(en.target); }
      }), { threshold: 0.12 })
    : { observe: (el) => el.classList.add("in"), unobserve() {} };

  const navObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return;
        document.querySelectorAll("#links a").forEach((a) =>
          a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
      }), { rootMargin: "-45% 0px -50% 0px" })
    : { observe() {} };

  function enhance() {
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
    document.querySelectorAll("main section[id]").forEach((el) => navObserver.observe(el));
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

  /* ---------- Load and render ---------- */
  async function init() {
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

    applyMeta(data);
    loadAnalytics(data.analytics && data.analytics.goatcounter);

    const parts = [
      ["about", "About", renderAbout(data)],
      ["cv", "CV", renderCV(data)],
      ["honors", "Honors", renderHonors(data)],
      ["research", "Research", renderResearch(data)],
      ["teaching", "Teaching", renderTeaching(data)],
      ["projects", "Projects", renderProjects(data)],
      ["team", "Team", renderTeam(data)],
      ["contact", "Contact", renderContact(data)]
    ].filter((part) => part[2]);

    $("#links").replaceChildren(...parts.map(([id, label]) => h("a", { href: "#" + id, text: label })));
    $("#top").replaceChildren(renderHero(data), ...parts.map((part) => part[2]));
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

  /* ---------- Mobile menu (links are created later, so use event delegation) ---------- */
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

  init();
})();
