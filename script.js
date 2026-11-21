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

  const link = (url, label, track, title) =>
    url
      ? h("a", { href: url, target: "_blank", rel: "noopener noreferrer", "data-track": track, "data-title": title, text: label })
      : null;

  const section = (id, title, ...kids) =>
    h("section", { id },
      h("div", { class: "wrap" }, h("h2", { text: title }), ...kids));

  /* ---------- Analytics (GoatCounter, cookie-free) ---------- */
  function loadAnalytics(code) {
    if (!code) return;
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://gc.zgo.at/count.js";
    s.setAttribute("data-goatcounter", `https://${code}.goatcounter.com/count`);
    document.head.append(s);
  }

  /* Count a named event such as a CV download. Pageviews are counted automatically. */
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

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Person",
      name: p.name,
      jobTitle: p.title,
      url: location.origin + location.pathname,
      sameAs: (d.links || []).map((l) => l.url).filter(Boolean)
    });
    document.head.append(ld);
  }

  /* ---------- Sections ---------- */
  function renderHero(d) {
    const p = d.profile;
    return h("section", { class: "hero" },
      h("div", { class: "wrap" },
        h("h1", { text: p.name }),
        h("div", { class: "sub", text: p.title }),
        h("p", { text: p.intro }),
        h("div", { class: "btns" },
          p.cvUrl ? h("a", { class: "btn primary", href: p.cvUrl, target: "_blank", rel: "noopener", "data-track": "download-cv", text: "Download CV" }) : null,
          h("a", { class: p.cvUrl ? "btn" : "btn primary", href: "#contact", text: "Get in touch" }),
          h("a", { class: "btn ghost", href: "#research", text: "Research →" })
        ),
        (d.links || []).some((l) => l.url)
          ? h("div", { class: "chips" }, d.links.map((l) => link(l.url, l.label, "social-click", l.label)))
          : null,
        h("div", { class: "stats" },
          (d.stats || []).map((s) => h("div", { class: "stat reveal" }, h("b", { text: s.value }), h("span", { text: s.label }))))
      ));
  }

  function renderCV(d) {
    return section("cv", "CV",
      h("div", { class: "timeline" },
        (d.cv || []).map((e) =>
          h("div", { class: "tl-item reveal" },
            h("div", { class: "tl-date", text: [e.dateStart, e.dateEnd].filter(Boolean).join(" – ") }),
            h("h3", { text: e.title }),
            h("div", { class: "org", text: e.institution }),
            e.description ? h("p", { class: "muted", text: e.description }) : null))),
      h("h3", { class: "subhead", text: "Skills" }),
      h("div", null, (d.skills || []).map((s) => h("span", { class: "tag", text: s }))));
  }

  function renderResearch(d) {
    return section("research", "Research",
      (d.research || []).map((p) =>
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
    return section("teaching", "Teaching",
      (d.teaching || []).map((t) =>
        h("article", { class: "item reveal" },
          t.semester ? h("span", { class: "badge", text: t.semester }) : null,
          h("h3", { text: t.title }),
          t.description ? h("p", { class: "muted", text: t.description }) : null,
          h("div", { class: "item-links" }, link(t.materialsUrl, "Materials", "teaching-materials", t.title)))));
  }

  function renderProjects(d) {
    return section("projects", "Projects",
      h("div", { class: "grid" },
        (d.projects || []).map((a) =>
          h("div", { class: "card reveal" },
            h("h3", { text: a.name }),
            h("p", { text: a.description }),
            h("div", null, (a.stack || []).map((t) => h("span", { class: "tag", text: t }))),
            link(a.link, "View project →", "project-click", a.name)))));
  }

  function renderContact(d) {
    const p = d.profile;
    const copyBtn = h("button", {
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
      h("button", { class: "btn primary", type: "submit", text: "Send message", style: "justify-self:start;cursor:pointer" }));

    return section("contact", "Contact",
      h("p", { class: "muted", text: "Send a message and it opens in your email app." }),
      form,
      p.email ? h("div", { class: "contact-email" },
        h("span", { class: "muted", text: "Or email " }),
        h("a", { href: `mailto:${p.email}`, text: p.email }),
        copyBtn) : null);
  }

  function renderFooter(d) {
    const socials = (d.links || []).filter((l) => l.url)
      .map((l) => link(l.url, l.label, "social-click", l.label));
    $("#footer").replaceChildren(
      h("div", { class: "foot" },
        h("span", { text: `© ${new Date().getFullYear()} ${d.profile.name}` }),
        h("span", null, socials)));
  }

  /* ---------- Behaviour after render ---------- */
  function enhance() {
    document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));
    document.querySelectorAll("main section[id]").forEach((el) => navObserver.observe(el));
  }

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

    $("#top").replaceChildren(
      renderHero(data),
      renderCV(data),
      renderResearch(data),
      renderTeaching(data),
      renderProjects(data),
      renderContact(data)
    );
    renderFooter(data);
    enhance();
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
  menu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      menu.classList.remove("open");
      burger.setAttribute("aria-expanded", "false");
    }));

  init();
})();
