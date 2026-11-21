document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Load Shared Navbar and Footer
    fetch('shared/navbar.html').then(r => r.text()).then(html => {
        document.getElementById('navbar-placeholder').innerHTML = html;
        setupTheme();
    });
    fetch('shared/footer.html').then(r => r.text()).then(html => {
        document.getElementById('footer-placeholder').innerHTML = html;
    });

    // 2. Populate Home Page
    if (document.getElementById('hero-name')) {
        document.getElementById('hero-name').innerText = siteData.profile.name;
        document.getElementById('hero-title').innerText = siteData.profile.title;
        document.getElementById('hero-bio').innerText = siteData.profile.bio;
        document.getElementById('link-github').href = siteData.profile.github;
        document.getElementById('link-linkedin').href = siteData.profile.linkedin;
        
        // Highlights
        const highlightsDiv = document.getElementById('highlights-grid');
        siteData.highlights.forEach(h => {
            highlightsDiv.innerHTML += `<div class="highlight-card reveal"><h3>${h.title}</h3><p>${h.desc}</p></div>`;
        });

        // Recent Projects (Show first 3)
        const featuredDiv = document.getElementById('featured-projects');
        siteData.projects.slice(0, 3).forEach(p => {
            const tags = p.tags.map(t => `<span>${t}</span>`).join('');
            featuredDiv.innerHTML += `
                <div class="project-card reveal">
                    <h3><a href="${p.link}">${p.title}</a></h3>
                    <p>${p.desc}</p>
                    <div class="tags">${tags}</div>
                </div>`;
        });
    }

    // 3. Populate Projects Page
    const projContainer = document.getElementById('projects-container');
    if (projContainer) {
        siteData.projects.forEach(p => {
            const tags = p.tags.map(t => `<span>${t}</span>`).join('');
            projContainer.innerHTML += `
                <div class="project-card reveal">
                    <h3><a href="${p.link}">${p.title}</a></h3>
                    <p>${p.desc}</p>
                    <div class="tags">${tags}</div>
                </div>`;
        });
    }

    // 4. Populate Research Page
    const resContainer = document.getElementById('research-container');
    if (resContainer) {
        // Interests
        const intList = siteData.research.interests.map(i => `<li>${i}</li>`).join('');
        resContainer.innerHTML += `<div class="exp-item reveal"><h3>Research Interests</h3><ul>${intList}</ul></div>`;
        
        // Experience
        siteData.research.experience.forEach(e => {
            const details = e.details.map(d => `<li>${d}</li>`).join('');
            resContainer.innerHTML += `
                <div class="exp-item reveal">
                    <h3>${e.role} <span class="text-accent">@ ${e.org}</span></h3>
                    <p>${e.period} | Supervisor: ${e.supervisor}</p>
                    <ul>${details}</ul>
                </div>`;
        });
    }

    // 5. Populate Publications Page
    const pubContainer = document.getElementById('publications-container');
    if (pubContainer) {
        siteData.publications.forEach(p => {
            pubContainer.innerHTML += `
                <div class="pub-item reveal">
                    <h3><a href="${p.link}">${p.title}</a></h3>
                    <p>${p.authors} | ${p.venue} | ${p.year}</p>
                </div>`;
        });
    }

    // 6. Populate Teaching Page
    const teachContainer = document.getElementById('teaching-container');
    if (teachContainer) {
        siteData.teaching.forEach(t => {
            const details = t.details.map(d => `<li>${d}</li>`).join('');
            teachContainer.innerHTML += `
                <div class="exp-item reveal">
                    <h3>${t.role} <span class="text-accent">@ ${t.org}</span></h3>
                    <p>${t.period}</p>
                    <ul>${details}</ul>
                </div>`;
        });
    }

    // 7. Populate Skills Page
    const skillContainer = document.getElementById('skills-container');
    if (skillContainer) {
        for (const [category, list] of Object.entries(siteData.skills)) {
            const skills = list.map(s => `<span>${s}</span>`).join('');
            skillContainer.innerHTML += `
                <div class="skill-category reveal">
                    <h3 style="text-transform: capitalize;">${category}</h3>
                    <div class="skill-list">${skills}</div>
                </div>`;
        }
    }

    // 8. Setup Reveal Animations
    setTimeout(() => {
        const revealElements = document.querySelectorAll('.reveal');
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, { threshold: 0.1 });
        revealElements.forEach(el => observer.observe(el));
    }, 500); // Small delay to let data populate
});

// Theme Toggle Logic
function setupTheme() {
    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;
    const icon = toggleBtn.querySelector('i');
    
    // Check local storage
    if (localStorage.getItem('theme') === 'light') {
        document.body.classList.add('light-mode');
        icon.classList.replace('fa-sun', 'fa-moon');
    } else {
        icon.classList.replace('fa-moon', 'fa-sun');
    }

    toggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        if (document.body.classList.contains('light-mode')) {
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });
}