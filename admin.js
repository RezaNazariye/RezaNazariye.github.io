(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);

  /* ----------------------------------------------------------------
     Schema: describes each section of content.json and its form.
     kind "object": one set of fields. kind "list": repeatable items.
     kind "tags": a comma-separated list of strings. kind "files": uploads.
     ---------------------------------------------------------------- */
  const SECTIONS = [
    { key: "profile", label: "Profile", kind: "object", fields: [
      { key: "name", label: "Name" },
      { key: "title", label: "Title" },
      { key: "intro", label: "Intro", type: "textarea" },
      { key: "email", label: "Email", type: "email" },
      { key: "location", label: "Location" },
      { key: "cvUrl", label: "CV file URL", type: "url", hint: "Upload your CV in the Files tab, then paste the URL here." }
    ]},
    { key: "links", label: "Social links", kind: "list", titleKey: "label", fields: [
      { key: "label", label: "Label" },
      { key: "url", label: "URL", type: "url" }
    ]},
    { key: "stats", label: "Stats", kind: "list", titleKey: "label", fields: [
      { key: "value", label: "Value" },
      { key: "label", label: "Label" }
    ]},
    { key: "skills", label: "Skills", kind: "tags", help: "Separate skills with commas." },
    { key: "cv", label: "CV", kind: "list", titleKey: "title", fields: [
      { key: "title", label: "Title" },
      { key: "institution", label: "Institution" },
      { key: "dateStart", label: "Start" },
      { key: "dateEnd", label: "End", hint: "Leave empty for a single date. Write \"Present\" for ongoing." },
      { key: "description", label: "Description", type: "textarea" }
    ]},
    { key: "research", label: "Research", kind: "list", titleKey: "title", fields: [
      { key: "title", label: "Title" },
      { key: "coauthors", label: "Co-authors" },
      { key: "status", label: "Status", hint: "For example: Published, Working paper, Draft." },
      { key: "abstract", label: "Abstract", type: "textarea" },
      { key: "pdfUrl", label: "PDF URL", type: "url" },
      { key: "codeUrl", label: "Code URL", type: "url" }
    ]},
    { key: "teaching", label: "Teaching", kind: "list", titleKey: "title", fields: [
      { key: "title", label: "Course" },
      { key: "semester", label: "Semester" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "materialsUrl", label: "Materials URL", type: "url" }
    ]},
    { key: "projects", label: "Projects", kind: "list", titleKey: "name", fields: [
      { key: "name", label: "Name" },
      { key: "description", label: "Description", type: "textarea" },
      { key: "link", label: "Link", type: "url" },
      { key: "stack", label: "Tech stack", type: "tags", hint: "Separate with commas." }
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

  /* ---------- Base64 helpers that handle UTF-8 correctly ---------- */
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
      const err = new Error(`${res.status} ${res.statusText}`);
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

    const info = await api("");
    if (info.permissions && !info.permissions.push) {
      throw new Error("This token cannot write to the repository. Give it Contents: Read and write.");
    }

    const file = await api(`contents/content.json?ref=${state.branch}`);
    state.sha = file.sha;
    const data = JSON.parse(decodeText(file.content));
    state.data = withDefaults(data);
    state.dirty = false;
  }

  function withDefaults(d) {
    d.profile = d.profile || {};
    d.analytics = d.analytics || { goatcounter: "" };
    ["links", "stats", "skills", "cv", "research", "teaching", "projects"].forEach((k) => {
      if (!Array.isArray(d[k])) d[k] = [];
    });
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
      } else {
        toast("Save failed: " + err.message, true);
      }
    } finally {
      setBusy(false);
      refreshChrome();
    }
  }

  /* ---------- Uploads (goes to files/ in the repo) ---------- */
  async function uploadFile(file) {
    const name = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    const path = `files/${name}`;

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
    return `${siteBase()}/${path}`;
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
    toastTimer = setTimeout(() => el.classList.add("hidden"), 4200);
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
    } else if (sec.kind === "tags") {
      body = field({ label: "Skills", type: "tags" }, d[sec.key], (v) => { d[sec.key] = v; touch(); });
    } else {
      body = filesForm();
    }
    $("#panel").replaceChildren(
      h("h2", { text: sec.label }),
      sec.help ? h("p", { class: "muted", text: sec.help }) : null,
      body
    );
  }

  /* ---------- Form builders ---------- */
  function field(f, value, onChange) {
    const isTags = f.type === "tags";
    const input = f.type === "textarea"
      ? h("textarea", { rows: 3 })
      : h("input", { type: f.type === "email" || f.type === "url" ? f.type : "text" });

    input.value = isTags ? (value || []).join(", ") : (value ?? "");
    input.addEventListener("input", () => {
      onChange(isTags
        ? input.value.split(",").map((s) => s.trim()).filter(Boolean)
        : input.value);
    });

    return h("label", { class: "field" },
      h("span", { text: f.label }),
      f.hint ? h("small", { class: "muted", text: f.hint }) : null,
      input);
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
    const picker = h("input", { type: "file", accept: ".pdf,.png,.jpg,.jpeg,.webp,.txt,.bib" });
    const out = h("div", { class: "muted" });
    const go = h("button", {
      class: "btn primary", type: "button", text: "Upload",
      onclick: async () => {
        const file = picker.files[0];
        if (!file) return toast("Choose a file first.", true);
        go.disabled = true;
        out.textContent = "Uploading…";
        try {
          const url = await uploadFile(file);
          out.replaceChildren(
            h("div", { text: "Uploaded. Public URL:" }),
            h("code", { text: url }),
            h("div", { style: "margin-top:8px" },
              h("button", {
                class: "btn small", type: "button", text: "Copy URL",
                onclick: () => navigator.clipboard.writeText(url).then(() => toast("URL copied."))
              })),
            h("p", { class: "muted", text: "Paste the URL into a CV, research, teaching, or project field, then save. The file goes live after the next Pages build." })
          );
        } catch (err) {
          out.textContent = "Upload failed: " + err.message;
        } finally {
          go.disabled = false;
        }
      }
    });
    return h("div", null,
      h("p", { class: "muted", text: "Files are stored in the files/ folder of the repository. Use short file names without spaces." }),
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
    const defaultOwner = location.hostname.endsWith(".github.io") ? location.hostname.split(".")[0] : "";
    const defaultRepo = location.hostname.endsWith(".github.io") ? location.hostname : "";
    $("#owner").value = localStorage.getItem("gh_owner") || defaultOwner;
    $("#repo").value = localStorage.getItem("gh_repo") || defaultRepo;

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
