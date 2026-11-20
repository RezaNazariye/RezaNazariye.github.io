document.addEventListener('DOMContentLoaded', () => {
    // 1. Load Navbar and Footer
    fetch('shared/navbar.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('navbar-placeholder').innerHTML = html;
            setupThemeToggle(); // Call after navbar is loaded
            highlightActiveLink();
        });

    fetch('shared/footer.html')
        .then(res => res.text())
        .then(html => {
            document.getElementById('footer-placeholder').innerHTML = html;
        });

    // 2. Populate Data (Hero Section)
    if (document.getElementById('hero-name')) {
        document.getElementById('hero-name').innerText = siteData.profile.name;
        document.getElementById('hero-title').innerText = siteData.profile.title;
        document.getElementById('link-github').href = siteData.profile.github;
        document.getElementById('link-linkedin').href = siteData.profile.linkedin;
    }

    // 3. Populate Data (Projects Page)
    const projectsGrid = document.getElementById('projects-grid');
    if (projectsGrid) {
        siteData.projects.forEach(proj => {
            const tagsHTML = proj.tags.map(tag => `<span>${tag}</span>`).join('');
            projectsGrid.innerHTML += `
                <div class="project-card">
                    <h3><a href="${proj.link}" target="_blank">${proj.title}</a></h3>
                    <p>${proj.description}</p>
                    <div class="project-tags">${tagsHTML}</div>
                </div>
            `;
        });
    }

    // 4. Populate Data (Research Page)
    const researchList = document.getElementById('research-list');
    if (researchList) {
        siteData.experience.forEach(exp => {
            const detailsHTML = exp.details.map(d => `<li>${d}</li>`).join('');
            researchList.innerHTML += `
                <div class="experience-item">
                    <h3>${exp.role} <span class="text-accent">@ ${exp.organization}</span></h3>
                    <p class="text-muted">${exp.period}</p>
                    <ul>${detailsHTML}</ul>
                </div>
            `;
        });
    }

    // Theme Toggle Logic
    function setupThemeToggle() {
        const btn = document.getElementById('theme-toggle');
        if (!btn) return;
        const icon = btn.querySelector('i');
        
        // Load saved theme
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            icon.classList.replace('fa-moon', 'fa-sun');
        }

        btn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            if (document.body.classList.contains('dark-mode')) {
                icon.classList.replace('fa-moon', 'fa-sun');
                localStorage.setItem('theme', 'dark');
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    // Highlight active page in navbar
    function highlightActiveLink() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.nav-links a').forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.style.color = 'var(--accent)';
                link.style.fontWeight = '700';
            }
        });
    }

    async function loadComponent(path, elementId) {
        const container = document.getElementById(elementId);

        if (!container) return;

        try {
            const response = await fetch(path);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${path}`);
            }

            container.innerHTML = await response.text();

        } catch (error) {
            console.error("Component loading failed:", error);
        }
    }

});