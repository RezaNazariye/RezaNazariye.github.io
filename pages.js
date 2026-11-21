(function () {
  "use strict";

  const S = window.Site;
  const { h, media, initials, paragraphs, link, chip, track, slug } = S;

  /* ---------- Building blocks ---------- */
  const pageHead = (eyebrow, title, lead) =>
    h("section", { class: "page-head" },
      h("div", { class: "wrap" },
        eyebrow ? h("div", { class: "eyebrow", text: eyebrow }) : null,
        h("h1", { text: title }),
        lead ? h("p", { class: "lead", text: lead }) : null));

  const body = (...kids) =>
    h("section", { class: "page-body" }, h("div", { class: "wrap" }, kids));

  const emptyNote = () => h("p", { class: "muted", text: "Nothing here yet." });

  /* A full page: header, then content. Shows a note when there is nothing to show. */
  const page = (eyebrow, title, lead, content) => [
    pageHead(eyebrow, title, lead),
    body(content && content.length ? content : emptyNote())
  ];

  /* A block on the home page: a heading, a "view all" link, then content. */
  const block = (title, moreHref, moreLabel, ...kids) =>
    h("section", { class: "page-body" },
      h("div", { class: "wrap" },
        h("div", { class: "block-head" },
          h("h2", { text: title }),
          moreHref ? h("a", { href: moreHref, text: moreLabel }) : null),
        kids));

  const statsBar = (d) => (d.stats || []).length
    ? h("section", { class: "stats-wrap" },
        h("div", { class: "stats" }, d.stats.map((s) =>
          h("div", { class: "stat reveal" }, h("b", { text: s.value }), h("span", { text: s.label })))))
    : null;

  const honorList = (items) =>
    h("ul", { class: "honor-list" }, items.map((x) =>
      h("li", { class: "reveal" },
        h("span", { class: "honor-title", text: x.title }),
        x.year ? h("span", { class: "badge", text: x.year }) : null)));

  const researchCards = (items) => items.map((p) =>
    h("article", { class: "card reveal" },
      p.status ? h("span", { class: "badge", text: p.status }) : null,
      h("h3", { text: p.title }),
      p.coauthors ? h("div", { class: "muted small", text: p.coauthors }) : null,
      p.abstract ? h("p", { text: p.abstract }) : null,
      h("div", { class: "card-actions" },
        link(p.pdfUrl, "PDF", "paper-pdf", p.title),
        link(p.codeUrl, "Code", "paper-code", p.title))));

  const teachingCards = (items) => items.map((t) =>
    h("article", { class: "card reveal" },
      t.semester ? h("span", { class: "badge", text: t.semester }) : null,
      h("h3", { text: t.title }),
      t.description ? h("p", { text: t.description }) : null,
      h("div", { class: "card-actions" }, link(t.materialsUrl, "Materials", "teaching-materials", t.title))));

  /* A project card with a Code link, a live GitHub star count, and a like button.
     A like is recorded as a GoatCounter event, so you see the totals in your dashboard.
     Each browser can like a project once. */
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

  const personCard = (m) =>
    h("article", { class: "card reveal person" },
      media(m.photo, m.name, initials(m.name), "avatar-lg"),
      h("h3", { text: m.name }),
      m.role ? h("p", { text: m.role }) : null,
      link(m.url, "Profile ↗", "team-profile", m.name));

  const ctaBlock = () =>
    h("section", { class: "cta" },
      h("div", { class: "wrap cta-inner" },
        h("div", null,
          h("h2", { text: "Let's talk" }),
          h("p", { class: "muted", text: "Questions about my work, or a possible collaboration." })),
        h("a", { class: "btn primary", href: "contact.html", text: "Contact me" })));

  /* ---------- Pages ---------- */
  Object.assign(S.pages, {

    /* Home: a short summary. Each block links to its full page. */
    home(d) {
      const p = d.profile;
      const firstPara = paragraphs((d.about || {}).body)[0];
      const projects = d.projects || [];
      const research = d.research || [];
      const honors = d.honors || [];

      return [
        h("section", { class: "hero" },
          h("div", { class: "wrap hero-grid" },
            media(p.photo, p.name, initials(p.name), "portrait"),
            h("div", { class: "hero-copy" },
              h("div", { class: "eyebrow", text: p.title }),
              h("h1", { text: p.name }),
              p.location ? h("div", { class: "muted", text: p.location }) : null,
              h("p", { class: "lead", text: p.intro }),
              h("div", { class: "btns" },
                p.cvUrl ? h("a", { class: "btn primary", href: p.cvUrl, target: "_blank", rel: "noopener", "data-track": "download-cv", text: "Download CV" }) : null,
                h("a", { class: p.cvUrl ? "btn" : "btn primary", href: "contact.html", text: "Get in touch" })),
              (d.links || []).some((l) => l.url)
                ? h("div", { class: "chips" }, d.links.filter((l) => l.url).map((l) => chip(l)))
                : null))),
        statsBar(d),
        projects.length
          ? block("Selected projects", "projects.html", "All projects →",
              h("div", { class: "grid" }, projects.slice(0, 3).map((x) => projectCard(x))))
          : null,
        firstPara
          ? block("About", "about.html", "Read more →", h("p", { class: "prose-lead", text: firstPara }))
          : null,
        research.length
          ? block("Research", "research.html", "All research →", h("div", { class: "stack" }, researchCards(research.slice(0, 1))))
          : null,
        honors.length
          ? block("Honors", "honors.html", "All honors →", honorList(honors.slice(0, 3)))
          : null,
        ctaBlock()
      ];
    },

    /* About: full text, the portrait, interests, and a photo gallery. */
    about(d) {
      const a = d.about || {};
      const paras = paragraphs(a.body);
      const gallery = (d.gallery || []).filter((g) => g.image);
      const interests = a.interests || [];
      return [
        pageHead(d.profile.title, "About me", null),
        body(
          h("div", { class: "about-grid" },
            media(d.profile.photo, d.profile.name, initials(d.profile.name), "portrait-lg"),
            h("div", { class: "prose" }, paras.map((t) => h("p", { text: t })))),
          interests.length
            ? h("div", { class: "interests" },
                h("h3", { text: "Interests" }),
                interests.map((t) => h("span", { class: "tag", text: t })))
            : null,
          gallery.length
            ? h("div", { class: "gallery" }, gallery.map((g) =>
                h("figure", { class: "gallery-item reveal" },
                  media(g.image, g.caption || d.profile.name, "", "gallery-img"),
                  g.caption ? h("figcaption", { text: g.caption }) : null)))
            : null)
      ];
    },

    /* CV: grouped timeline and skills. */
    cv(d) {
      const entries = d.cv || [];
      const order = ["Education", "Research", "Work", "Teaching", "Other"];
      const groups = order
        .map((c) => [c, entries.filter((e) => (e.category || "Other") === c)])
        .filter(([, items]) => items.length);
      const skills = d.skills || [];

      return [
        pageHead(d.profile.title, "Curriculum vitae", null),
        body(
          groups.map(([name, items]) =>
            h("div", { class: "cv-group" },
              h("h2", { text: name }),
              h("div", { class: "timeline" }, items.map((e) =>
                h("div", { class: "tl-item reveal" },
                  h("div", { class: "tl-date", text: [e.dateStart, e.dateEnd].filter(Boolean).join(" – ") }),
                  h("h3", { text: e.title }),
                  e.institution ? h("div", { class: "org", text: e.institution }) : null,
                  e.description ? h("p", { class: "muted", text: e.description }) : null))))),
          skills.length
            ? h("div", { class: "cv-group" },
                h("h2", { text: "Skills" }),
                h("div", { class: "skill-groups" }, skills.map((g) =>
                  h("div", { class: "skill-group" },
                    h("div", { class: "muted small", text: g.group }),
                    h("div", null, (g.items || []).map((t) => h("span", { class: "tag", text: t }))))))
              )
            : null,
          d.profile.cvUrl
            ? h("div", { class: "btns" },
                h("a", { class: "btn primary", href: d.profile.cvUrl, target: "_blank", rel: "noopener", "data-track": "download-cv", text: "Download CV (PDF)" }))
            : null)
      ];
    },

    research(d) {
      const items = d.research || [];
      return page("Research", "Research", null, items.length ? [h("div", { class: "stack" }, researchCards(items))] : []);
    },

    teaching(d) {
      const items = d.teaching || [];
      return page("Teaching", "Teaching", null, items.length ? [h("div", { class: "stack" }, teachingCards(items))] : []);
    },

    projects(d) {
      const items = d.projects || [];
      return page("Projects", "Projects", null, items.length ? [h("div", { class: "grid" }, items.map((p) => projectCard(p)))] : []);
    },

    honors(d) {
      const items = d.honors || [];
      return page("Honors", "Honors & rankings", null, items.length ? [honorList(items)] : []);
    },

    team(d) {
      const items = d.team || [];
      return page("Team", "Team", null, items.length ? [h("div", { class: "grid" }, items.map((m) => personCard(m)))] : []);
    },

    /* Contact: details on the left, the message form on the right. */
    contact(d) {
      const p = d.profile;

      const form = h("form", {
        id: "contact-form",
        onsubmit: (event) => {
          event.preventDefault();
          const data = new FormData(event.target);
          const name = data.get("name");
          const subject = data.get("subject") || `Message from ${name}`;
          const text = `${data.get("message")}\n\n— ${name} (${data.get("email")})`;
          track("contact-submit");
          window.location.href =
            `mailto:${p.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
        }
      },
        h("input", { name: "name", placeholder: "Your name", required: true, autocomplete: "name" }),
        h("input", { name: "email", type: "email", placeholder: "Your email", required: true, autocomplete: "email" }),
        h("input", { name: "subject", placeholder: "Subject" }),
        h("textarea", { name: "message", placeholder: "Your message", required: true }),
        h("button", { class: "btn primary", type: "submit", text: "Send message" }));

      const details = h("div", null,
        p.email ? h("div", { class: "detail" },
          h("span", { class: "muted", text: "Email" }),
          h("a", { href: `mailto:${p.email}`, text: p.email })) : null,
        p.location ? h("div", { class: "detail" },
          h("span", { class: "muted", text: "Location" }),
          h("div", { text: p.location })) : null,
        (d.links || []).some((l) => l.url)
          ? h("div", { class: "detail" },
              h("span", { class: "muted", text: "Elsewhere" }),
              h("div", { class: "chips" }, d.links.filter((l) => l.url).map((l) => chip(l))))
          : null);

      return [
        pageHead("Contact", "Get in touch", "Send a message and it opens in your email app."),
        body(h("div", { class: "two-col" }, details, form))
      ];
    }
  });
})();
