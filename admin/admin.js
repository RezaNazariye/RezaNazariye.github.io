(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  const CV_CATEGORIES = ["Education", "Research", "Work", "Teaching", "Other"];
  const ICONS = ["github", "linkedin", "email", "instagram", "x", "telegram", "scholar", "other"];

  /* ----------------------------------------------------------------
     Schema: describes each section of content.json and its form.
     object: one set of fields. list: repeatable items.
     Field types: text (default), textarea, email, url, tags, select, image.
     ---------------------------------------------------------------- */
  const SECTIONS = [
    { key: "profile", label: "Profile", kind: "object", fields: [
      { key: "name", label: "Name" },
      { key: "title", label: "Title" },
      { key: "intro", label: "Short intro (top of the page)", type: "textarea" },
      { key: "location", label: "Location" },
      { key: "email", label: "Email", type: "email" },
      { key: "photo", label: "Photo", type: "image", hint: "PNG, JPG, SVG or WebP. Leave empty to show your initials." },
      { key: "cvUrl", label: "CV file", type: "url", hint: "For example CV.pdf. Upload it in the Files tab first." }
    ]},
    { key: "about", label: "About", kind: "object", fields: [
      { key: "body", label: "About me", type: "textarea", hint: "Separate paragraphs with a blank line. Write about engineering and beyond." },
      { key: "interests", label: "Interests", type: "tags", hint: "Comma separated, for example Photography, Chess, Running." }
    ]},
    { key: "links", label: "Social links", kind: "list", titleKey: "label", fields: [
      { key: "label", label: "Label" },
      { key: "url", label: "URL", type: "url", hint: "For email, use mailto:you@example.com" },
      { key: "icon", label: "Icon", type: "select", options: ICONS }
    ]},
    { key: "stats", label: "Stats", kind: "list", titleKey: "label", fields: [
      { key: "value", label: "Value" },
      { key: "label", label: "Label" }
    ]},
    { key: "honors", label: "Honors", kind: "list", titleKey: "title", fields: [
      { key: "title", label: "Honor" },
      { key: "year", label: "Year" }
    ]},
    { key: "skills", label: "Skills", kind: "list", titleKey: "group", fields: [
      { key: "group", label: "Group, for example Hardware" },
      { key: "items", label: "Skills", type: "tags", hint: "Comma separated." }
    ]},
    { key: "cv", label: "CV", kind: "list", titleKey: "title", fields: [
      { key: "category", label: "Section", type: "select", options: CV_CATEGORIES },
      { key: "title", label: "Title" },
      { key: "institution", label: "Institution" },
      { key: "dateStart", label: "Start" },
      { key: "dateEnd", label: "End", hint: "Leave empty for a single date. Write \"Present\" for ongoing." },
      { key: "description", label: "Description", type: "textarea" }
    ]},
    { key: "research", label: "Research", kind: "list", titleKey: "title", fields: [
      { key: "title", label: "Title" },
      { key: "coauthors", label: "Co-authors" },
      { key: "status", label: "Status", hint: "For example Published, Working paper, Lab project." },
      { key: "abstract", label: "Abstract", type: "textarea" },
      { key: "pdfUrl", label: "PDF URL", type: "url" },
      { key: "codeUrl", label: "Code URL", type: "url" }
    ]},
    { key: "teaching", label: "Teaching", kind: "list", titleKey: "title", fields: [
      { key: "title", label: "Course" },
      { key: "semester", label: "Semester or dates" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "materialsUrl", label: "Materials URL", type: "url" }
    ]},
    { key: "projects", label: "Projects", kind: "list", titleKey: "name", fields: [
      { key: "name", label: "Name" },
      { key: "image", label: "Image", type: "image", hint: "Optional. PNG, JPG, SVG or WebP." },
      { key: "description", label: "Description", type: "textarea" },
      { key: "repo", label: "GitHub repository", hint: "owner/name. Adds a Code link, a star count and a like button." },
      { key: "link", label: "Demo or other link", type: "url" },
      { key: "stack", label: "Tech stack", type: "tags", hint: "Comma separated." }
    ]},
    { key: "team", label: "Team", kind: "list", titleKey: "name", fields: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "photo", label: "Photo", type: "image" },
      { key: "url", label: "Profile link", type: "url" }
    ]},
    { key: "analytics", label: "Analytics", kind: "object", fields: [
      { key: "goatcounter", label: "GoatCounter code", hint: "The part before .goatcounter.com. Leave empty to turn tracking off." }
    ]},
    { key: "files", label: "Files", kind: "files" }
  ];

  const state = {
    owner: "", repo: "", token: "", branch: "main",
    sha: null, data: null, current: "profile", dirty: false
  };

  /* ---------- Small DOM helper (text goes through textContent) ---------- */
  function h(tag, props, ...kids) {
    const node = document.createElement(tag);
    if (props) {
      for (const [key, value] of Object.entries(props)) {
        if (value === undefined || value === null || value === false) continue;
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

  /* ---------- Base64 helpers that handle UTF-8 and large files ---------- */
  function bytesToB64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }
  const encodeText = (str) => bytesToB64(new TextEncoder().encode(str));
  const decodeText = (b64) => {
    const bin = atob(b64.replace(/\s/g, ""));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  };

  /* ---------- GitHub API ---------- */
  async function api(path, opts = {}) {
    const url = `https://api.github.com/repos/${state.owner}/${state.repo}` + (path ? `/${path}` : "");
    const res = await fetch(url, {
      ...opts,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${state.token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(opts.body ? { "Content-Type": "application/json" } : {})
      }
    });
    if (!res.ok) {
      let detail = "";
      try { detail = (await res.json()).message || ""; } catch (_) {}
      const err = new Error(`${res.status}${detail ? ": " + detail : " " + res.statusText}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }

  /* Base URL of the published site, e.g. https://rezanazariye.github.io */
  function siteBase() {
    return state.repo === `${state.owner}.github.io`
      ? `https://${state.repo}`
      : `https://${state.owner}.github.io/${state.repo}`;
  }

  /* ---------- Connect and load ---------- */
  async function connect(owner, repo, token) {
    state.owner = owner.trim();
    state.repo = repo.trim();
    state.token = token.trim();

    await api("");  // checks the token can see the repository

    const file = await api(`contents/content.json?ref=${state.branch}`);
    state.sha = file.sha;
    state.data = withDefaults(JSON.parse(decodeText(file.content)));
    state.dirty = false;
  }

  function withDefaults(d) {
    d.profile = d.profile || {};
    d.about = d.about || { body: "", interests: [] };
    d.analytics = d.analytics || { goatcounter: "" };
    ["links", "stats", "honors", "cv", "research", "teaching", "projects", "team"].forEach((k) => {
      if (!Array.isArray(d[k])) d[k] = [];
    });
    if (!Array.isArray(d.skills)) d.skills = [];
    // Older files stored skills as one flat list of strings. Convert it to a group.
    if (d.skills.length && typeof d.skills[0] === "string") {
      d.skills = [{ group: "Skills", items: d.skills }];
    }
    return d;
  }

  async function save() {
    setBusy(true);
    try {
      const body = JSON.stringify({
        message: `Update site content (${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC)`,
        content: encodeText(JSON.stringify(state.data, null, 2) + "\n"),
        sha: state.sha,
        branch: state.branch
      });
      const res = await api("contents/content.json", { method: "PUT", body });
      state.sha = res.content.sha;
      state.dirty = false;
      toast("Saved. The live site updates in about a minute.");
    } catch (err) {
      if (err.status === 409) {
        toast("The file changed somewhere else. Reload the page, then re-apply your edits.", true);
      } else if (err.status === 403) {
        toast("GitHub refused the save (403). Your token needs Contents: Read and write on this repository, and the branch must allow direct commits.", true);
      } else {
        toast("Save failed: " + err.message, true);
      }
    } finally {
      setBusy(false);
      refreshChrome();
    }
  }

  /* ---------- Uploads. Returns the path inside the repo, e.g. images/photo.jpg ---------- */
  async function uploadFile(file, folder) {
    const name = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `${folder}/${name}`;

    let sha = null;
    try {
      sha = (await api(`contents/${path}?ref=${state.branch}`)).sha;
    } catch (err) {
      if (err.status !== 404) throw err;
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    await api(`contents/${path}`, {
      method: "PUT",
      body: JSON.stringify({
        message: `Upload ${name}`,
        content: bytesToB64(bytes),
        branch: state.branch,
        ...(sha ? { sha } : {})
      })
    });
    return path;
  }

  /* ---------- UI state ---------- */
  function touch() {
    state.dirty = true;
    refreshChrome();
  }

  function refreshChrome() {
    $("#save").disabled = !state.dirty;
    $("#status").textContent = state.dirty ? "Unsaved changes" : "All changes published";
    const code = state.data && state.data.analytics && state.data.analytics.goatcounter;
    const stats = $("#view-stats");
    stats.classList.toggle("hidden", !code);
    if (code) stats.href = `https://${code}.goatcounter.com`;
    $("#view-site").href = siteBase() + "/";
  }

  function setBusy(busy) {
    $("#save").disabled = busy || !state.dirty;
    $("#save").textContent = busy ? "Publishing…" : "Save & publish";
  }

  let toastTimer;
  function toast(msg, isError) {
    const el = $("#toast");
    el.textContent = msg;
    el.className = "toast" + (isError ? " error" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 4500);
  }

  function renderTabs() {
    $("#tabs").replaceChildren(...SECTIONS.map((s) =>
      h("button", {
        class: "tab" + (s.key === state.current ? " active" : ""),
        type: "button",
        text: s.label,
        onclick: () => { state.current = s.key; renderTabs(); renderPanel(); }
      })));
  }

  function renderPanel() {
    const sec = SECTIONS.find((s) => s.key === state.current);
    const d = state.data;
    let body;
    if (sec.kind === "object") {
      body = h("div", null, sec.fields.map((f) =>
        field(f, d[sec.key][f.key], (v) => { d[sec.key][f.key] = v; touch(); })));
    } else if (sec.kind === "list") {
      body = listForm(sec, d[sec.key]);
    } else {
      body = filesForm();
    }
    $("#panel").replaceChildren(
      h("h2", { text: sec.label }),
      body
    );
  }

  /* ---------- Field builders ---------- */
  function field(f, value, onChange) {
    if (f.type === "image") return imageField(f, value, onChange);

    let input;
    if (f.type === "textarea") {
      input = h("textarea", { rows: 3 });
    } else if (f.type === "select") {
      input = h("select");
      const blank = document.createElement("option");
      blank.value = "";
      blank.textContent = "—";
      input.append(blank, ...(f.options || []).map((o) => h("option", { value: o, text: o })));
    } else {
      input = h("input", { type: f.type === "email" || f.type === "url" ? f.type : "text" });
    }

    const isTags = f.type === "tags";
    input.value = isTags ? (value || []).join(", ") : (value ?? "");
    input.addEventListener(f.type === "select" ? "change" : "input", () => {
      onChange(isTags
        ? input.value.split(",").map((s) => s.trim()).filter(Boolean)
        : input.value);
    });

    return h("label", { class: "field" },
      h("span", { text: f.label }),
      f.hint ? h("small", { class: "muted", text: f.hint }) : null,
      input);
  }

  /* Image field: a path or URL, a preview, and an upload button that stores the file in images/. */
  function imageField(f, value, onChange) {
    const input = h("input", { type: "text", placeholder: "images/photo.jpg" });
    input.value = value ?? "";

    const thumb = h("img", { class: "thumb" });
    const showThumb = () => {
      const v = input.value.trim();
      thumb.classList.toggle("hidden", !v);
      if (v) thumb.src = /^https?:/.test(v) ? v : `${siteBase()}/${v}`;
    };

    input.addEventListener("input", () => {
      onChange(input.value.trim());
      showThumb();
    });

    const picker = h("input", { type: "file", accept: "image/*" });
    picker.addEventListener("change", async () => {
      const file = picker.files[0];
      if (!file) return;
      toast("Uploading image…");
      try {
        const path = await uploadFile(file, "images");
        input.value = path;
        onChange(path);
        showThumb();
        toast("Image uploaded. Save to publish it.");
      } catch (err) {
        toast("Upload failed: " + err.message, true);
      } finally {
        picker.value = "";
      }
    });

    showThumb();
    return h("label", { class: "field" },
      h("span", { text: f.label }),
      f.hint ? h("small", { class: "muted", text: f.hint }) : null,
      h("div", { class: "image-row" }, thumb, input),
      picker);
  }

  function blankItem(sec) {
    const obj = {};
    sec.fields.forEach((f) => { obj[f.key] = f.type === "tags" ? [] : ""; });
    return obj;
  }

  function listForm(sec, items) {
    const wrap = h("div", { class: "list" });

    items.forEach((item, i) => {
      const title = h("strong", { text: item[sec.titleKey] || `Item ${i + 1}` });

      const move = (dir) => {
        const j = i + dir;
        if (j < 0 || j >= items.length) return;
        [items[i], items[j]] = [items[j], items[i]];
        touch();
        renderPanel();
      };
      const remove = () => {
        if (!confirm("Delete this item?")) return;
        items.splice(i, 1);
        touch();
        renderPanel();
      };

      wrap.append(h("div", { class: "card item" },
        h("div", { class: "item-head" },
          title,
          h("div", { class: "row" },
            h("button", { class: "btn small", type: "button", title: "Move up", "aria-label": "Move up", text: "↑", onclick: () => move(-1) }),
            h("button", { class: "btn small", type: "button", title: "Move down", "aria-label": "Move down", text: "↓", onclick: () => move(1) }),
            h("button", { class: "btn small danger", type: "button", text: "Delete", onclick: remove }))),
        sec.fields.map((f) =>
          field(f, item[f.key], (v) => {
            item[f.key] = v;
            if (f.key === sec.titleKey) title.textContent = v || `Item ${i + 1}`;
            touch();
          }))
      ));
    });

    wrap.append(h("button", {
      class: "btn", type: "button", text: "+ Add item",
      onclick: () => { items.push(blankItem(sec)); touch(); renderPanel(); }
    }));
    return wrap;
  }

  function filesForm() {
    const picker = h("input", { type: "file", accept: ".pdf,.png,.jpg,.jpeg,.svg,.webp,.txt,.bib" });
    const out = h("div", { class: "muted" });
    const go = h("button", {
      class: "btn primary", type: "button", text: "Upload",
      onclick: async () => {
        const file = picker.files[0];
        if (!file) return toast("Choose a file first.", true);
        go.disabled = true;
        out.textContent = "Uploading…";
        try {
          const path = await uploadFile(file, "files");
          const url = `${siteBase()}/${path}`;
          out.replaceChildren(
            h("div", { text: "Uploaded. Use this path, for example in the CV file field:" }),
            h("code", { text: path }),
            h("div", { text: "Full public URL:", style: "margin-top:8px" }),
            h("code", { text: url }),
            h("div", { style: "margin-top:8px" },
              h("button", {
                class: "btn small", type: "button", text: "Copy path",
                onclick: () => navigator.clipboard.writeText(path).then(() => toast("Path copied."))
              })),
            h("p", { class: "muted", text: "Images go in the images/ folder through the field's own upload button." })
          );
        } catch (err) {
          out.textContent = "Upload failed: " + err.message;
        } finally {
          go.disabled = false;
        }
      }
    });
    return h("div", null,
      h("p", { class: "muted", text: "Files go to the files/ folder of the repository, such as your CV or a paper PDF. Use short names without spaces." }),
      h("div", { style: "margin-bottom:12px" }, picker),
      go,
      h("div", { style: "margin-top:14px" }, out));
  }

  /* ---------- Login ---------- */
  function showLogin(message) {
    $("#app").classList.add("hidden");
    $("#login").classList.remove("hidden");
    $("#login-error").textContent = message || "";
  }

  function showApp() {
    $("#login").classList.add("hidden");
    $("#app").classList.remove("hidden");
    renderTabs();
    renderPanel();
    refreshChrome();
  }

  $("#login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const owner = $("#owner").value;
    const repo = $("#repo").value;
    const token = $("#token").value;
    $("#connect").disabled = true;
    $("#login-error").textContent = "Connecting…";
    try {
      await connect(owner, repo, token);
      sessionStorage.setItem("gh_token", token.trim());
      localStorage.setItem("gh_owner", owner.trim());
      localStorage.setItem("gh_repo", repo.trim());
      showApp();
    } catch (err) {
      $("#login-error").textContent = err.status === 404
        ? "Repository or content.json not found. Check the owner and name."
        : err.status === 401
          ? "The token was rejected. Check that it is correct and not expired."
          : err.message;
    } finally {
      $("#connect").disabled = false;
    }
  });

  $("#save").addEventListener("click", save);

  $("#logout").addEventListener("click", () => {
    sessionStorage.removeItem("gh_token");
    location.reload();
  });

  window.addEventListener("beforeunload", (event) => {
    if (state.dirty) { event.preventDefault(); event.returnValue = ""; }
  });

  /* ---------- Start ---------- */
  (async function start() {
    const onGithubIo = location.hostname.endsWith(".github.io");
    $("#owner").value = localStorage.getItem("gh_owner") || (onGithubIo ? location.hostname.split(".")[0] : "");
    $("#repo").value = localStorage.getItem("gh_repo") || (onGithubIo ? location.hostname : "");

    const token = sessionStorage.getItem("gh_token");
    if (!token) return showLogin();

    try {
      await connect($("#owner").value, $("#repo").value, token);
      showApp();
    } catch (err) {
      sessionStorage.removeItem("gh_token");
      showLogin("Session expired. Please connect again.");
    }
  })();
})();
