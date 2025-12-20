// Main script for example.html
document.addEventListener('DOMContentLoaded', function () {
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 700, once: true, offset: 100, easing: 'ease-out-cubic' });

        // Stagger timeline items for a more dynamic entrance
        const timelineItems = document.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, idx) => {
            item.setAttribute('data-aos', 'fade-up');
            item.setAttribute('data-aos-delay', String(idx * 120));
            item.setAttribute('data-aos-duration', '700');
        });
    }

    // Theme Toggle
    const themeToggle = document.querySelectorAll('.theme-toggle');
    const root = document.documentElement;

    function updateIcon(theme) {
        if (!themeToggle || themeToggle.length === 0) return;
        themeToggle.forEach(el => el.innerHTML = theme === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>');
    }

    function setTheme(theme) {
        root.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        updateIcon(theme);
    }

    // Load saved theme or default to light (or match system preference)
    const saved = localStorage.getItem('theme');
    const defaultTheme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(defaultTheme);

    if (themeToggle && themeToggle.length > 0) {
        themeToggle.forEach(el => el.addEventListener('click', () => {
            const current = root.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            setTheme(next);
        }));
    }

    // Sidebar (off-canvas) behavior
    const menuToggle = document.querySelector('.menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.querySelector('.sidebar-close');
    const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
    const sidebarLinks = sidebar ? sidebar.querySelectorAll('a[href^="#"]') : [];

    function openSidebar() {
        if (!sidebar) return;
        sidebar.classList.add('open');
        sidebarBackdrop.classList.add('open');
        menuToggle.setAttribute('aria-expanded', 'true');
        sidebar.setAttribute('aria-hidden', 'false');
        // set focus to first link
        const firstLink = sidebar.querySelector('a');
        if (firstLink) firstLink.focus();
        if (menuToggle) menuToggle.classList.add('open');
    }

    function closeSidebar() {
        if (!sidebar) return;
        sidebar.classList.remove('open');
        sidebarBackdrop.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        sidebar.setAttribute('aria-hidden', 'true');
        // return focus to menu button
        if (menuToggle) menuToggle.focus();
        if (menuToggle) menuToggle.classList.remove('open');
    }

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            const isOpen = sidebar.classList.contains('open');
            isOpen ? closeSidebar() : openSidebar();
        });
    }

    // Auto-close sidebar on resize when switching to large screens
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1024 && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }

    if (sidebarBackdrop) {
        sidebarBackdrop.addEventListener('click', closeSidebar);
    }

    // close sidebar when link clicked
    sidebarLinks.forEach(link => link.addEventListener('click', closeSidebar));

    // close on ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar && sidebar.classList.contains('open')) {
            closeSidebar();
        }
    });

    // Navbar Scroll Effect
    const navbar = document.querySelector('.nav-wrapper');
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }

    // Project Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const filter = button.getAttribute('data-filter');
                projectCards.forEach(card => {
                    if (filter === 'all' || card.getAttribute('data-category') === filter) {
                        card.style.display = 'block';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // Project card micro-interactions: tilt on mouse move
    if (projectCards && projectCards.length) {
        projectCards.forEach(card => {
            const inner = card.querySelector('.project-card-inner');
            if (!inner) return;
            // smoother transitions
            inner.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 .. 0.5
                const y = (e.clientY - rect.top) / rect.height - 0.5;
                const rotateX = (-y * 8).toFixed(2);
                const rotateY = (x * 8).toFixed(2);
                inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
            });
            card.addEventListener('mouseleave', () => {
                inner.style.transform = '';
            });
            card.addEventListener('mouseenter', () => {
                inner.style.willChange = 'transform';
            });
        });
    }

    // Animate decorative SVG when it enters viewport
    const expPath = document.querySelector('.experience-path');
    if (expPath) {
        if ('IntersectionObserver' in window) {
            const svgio = new IntersectionObserver((entries, obs) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        expPath.classList.add('drawn');
                        obs.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.4 });
            svgio.observe(expPath);
        } else {
            expPath.classList.add('drawn');
        }
    }

    // Trigger accent animations (skill labels and blobs) when visible
    const accent = document.querySelector('.experience-accent');
    if (accent && 'IntersectionObserver' in window) {
        const accObs = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    accent.classList.add('animate');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.35 });
        accObs.observe(accent);
    } else if (accent) {
        accent.classList.add('animate');
    }

    // Scroll to Top Button
    const scrollTopButton = document.getElementById('scroll-top');
    if (scrollTopButton) {
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 500) scrollTopButton.classList.add('visible');
            else scrollTopButton.classList.remove('visible');
        });
        scrollTopButton.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    // Highlight navigation links based on scroll position
    const navLinks = document.querySelectorAll('.nav-center a, .sidebar-nav a');
    const sections = Array.from(navLinks).map(link => document.querySelector(link.getAttribute('href'))).filter(Boolean);

    function updateActiveLink() {
        const scrollPos = window.scrollY + 120; // offset for fixed nav
        sections.forEach((section, idx) => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const link = navLinks[idx];
            if (scrollPos >= top && scrollPos < top + height) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    updateActiveLink();
    window.addEventListener('scroll', updateActiveLink);

    // Contact Form Handling (basic)
    // Configure your API endpoint here.
    // For local testing pin the API URL explicitly to avoid detection issues.
    // Change this to your deployed API when ready.
    let API_URL = 'http://localhost:3001/api/users'; // pinned for local testing (Step 2)

    // Note: the detection probe remains available as window.__detectApiPromise if you need it. (disabled by explicit pin)

    // Probe helper: try a list of ports and resolve the first one that responds to /api/_debug/echo
    window.__detectApiPromise = (async function detectApi() {
        const ports = [3000, 3001];
        const controllerTimeout = (ms) => {
            const c = new AbortController();
            const t = setTimeout(() => c.abort(), ms);
            return { signal: c.signal, clear: () => clearTimeout(t) };
        };
        for (const p of ports) {
            try {
                const { signal, clear } = controllerTimeout(800);
                const res = await fetch(`http://localhost:${p}/api/_debug/echo`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', signal
                });
                clear();
                if (res && res.ok) {
                    API_URL = `http://localhost:${p}/api/users`;
                    console.info(`[API DETECT] Using local API on port ${p}`);
                    return API_URL;
                }
            } catch (err) {
                // ignore and try next
            }
        }
        // If none responded, warn but keep current API_URL
        console.warn('[API DETECT] No local API detected on ports 3000/3001; using', API_URL);
        return API_URL;
    })();
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            // If detection is in progress, wait a short while so we target the correct API port
            if (window.__detectApiPromise) {
                try { await Promise.race([window.__detectApiPromise, new Promise(r => setTimeout(r, 2000))]); } catch(e) { /* ignore */ }
            }
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            console.log('Contact form submit', { apiUrl: API_URL, formData });
            const submitButton = contactForm.querySelector('button[type=submit]');
            if (submitButton) { submitButton.disabled = true; submitButton.textContent = 'Sending...'; }
            try {
                const resp = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    mode: 'cors',
                    body: JSON.stringify(formData)
                });
                console.log('Fetch response status', resp.status, 'apiUrl', API_URL);
                // Try to parse JSON but fallback gracefully to text for better error messages
                let data = null;
                try { data = await resp.json(); } catch (e2) { try { data = { error: await resp.text() }; } catch (e3) { data = null; } }
                if (resp.ok && data && data.ok) {
                    const methodNote = data.method ? ` (${data.method})` : '';
                    showNotification(`Message sent successfully!${methodNote}`, 'success');
                    console.info('Contact form successfully submitted', data);
                    contactForm.reset();
                } else if (data && (data.error || data.errors)) {
                    // show server-provided error message when possible
                    const msg = data.error || (Array.isArray(data.errors) ? data.errors.map(x=>x.msg).join('; ') : JSON.stringify(data.errors));
                    showNotification(`Server: ${msg} (HTTP ${resp.status})`, 'error');
                    console.error('Contact form server error', resp.status, data);
                } else if (resp.status === 405) {
                    // Method not allowed: run a quick diagnostics probe to give clearer guidance
                    console.error('Contact form received 405 (Method Not Allowed) — running diagnostics');
                    try {
                        // Attempt an OPTIONS request to the endpoint to see allowed methods
                        const opts = await fetch(API_URL, { method: 'OPTIONS' });
                        const allow = opts.headers.get('allow') || '(no Allow header)';
                        console.info('OPTIONS allowed methods:', allow, 'status:', opts.status);
                        // Try echo probe (serverless function at /api/_debug/echo if deployed)
                        let base = API_URL.replace(/\/users\/?$/, '');
                        if (!base.endsWith('/')) base = base + '/';
                        const echoUrl = base + '_debug/echo';
                        console.info('Trying echo probe at', echoUrl);
                        const echoRes = await fetch(echoUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                        // Read text first (safe for any response), then attempt to parse JSON
                        let echoText = '';
                        try {
                            echoText = await echoRes.text();
                        } catch (e) {
                            echoText = `unable to read body: ${e && e.message}`;
                        }
                        let echoBody = null;
                        try { echoBody = JSON.parse(echoText); } catch (e) { echoBody = { text: echoText }; }
                        console.info('Echo probe result', echoRes.status, echoBody);
                        // If echo returned 405 it likely indicates the static host does not provide serverless handlers at /api/*
                        if (echoRes.status === 405) {
                            showNotification(`Server rejected POST (405). Diagnostics: OPTIONS ${opts.status} allow=${allow}; echo ${echoRes.status}. This looks like a static dev server (e.g. Live Server on 5503) — run the API server (npm start) or set API_URL to your API origin.`, 'error');
                        } else {
                            showNotification(`Server rejected POST (405). Diagnostics: OPTIONS ${opts.status} allow=${allow}; echo ${echoRes.status}. Check that /api/users exists and accepts POST.`, 'error');
                        }
                    } catch (diagErr) {
                        console.error('Diagnostics failed', diagErr);
                        showNotification(`Error 405: server rejected POST and diagnostics failed (${diagErr.message || diagErr}) — ensure your API route supports POST.`, 'error');
                    }
                } else if (resp.status === 404) {
                    // Not found: give precise diagnostics and try to auto-recover by probing local dev API
                    console.error('Contact form error response 404', data);
                    // Read body text if available
                    let bodyText = '';
                    try { bodyText = await resp.text(); } catch (e) { bodyText = '(no body)'; }

                    // Run lightweight diagnostics: OPTIONS, echo probe, root GET
                    try {
                        const opts = await fetch(API_URL, { method: 'OPTIONS' });
                        const allow = opts.headers.get('allow') || '(no Allow header)';
                        let base = API_URL.replace(/\/users\/?$/, ''); if (!base.endsWith('/')) base = base + '/';
                        const echoUrl = base + '_debug/echo';
                        let echoRes = null; let echoBody = null; let echoText = '';
                        try {
                            echoRes = await fetch(echoUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
                            echoText = await echoRes.text();
                            try { echoBody = JSON.parse(echoText); } catch (e) { echoBody = { text: echoText }; }
                        } catch (e) { echoText = `echo probe failed: ${e && e.message}`; }

                        // Try a simple GET on the base (health check)
                        let rootOk = false; let rootStatus = null; let rootText = '';
                        try {
                            const r = await fetch(base, { method: 'GET' });
                            rootStatus = r.status; rootText = await r.text(); rootOk = r.ok;
                        } catch (e) { rootText = `root GET failed: ${e && e.message}`; }

                        console.info('404 diagnostics:', { allow, echo: { status: echoRes && echoRes.status, body: echoBody || echoText }, root: { status: rootStatus, ok: rootOk } });

                        // If detection is still running, wait for it and retry once if API_URL changes
                        if (window.__detectApiPromise) {
                            try {
                                const prevUrl = API_URL;
                                await Promise.race([window.__detectApiPromise, new Promise(r => setTimeout(r, 2000))]);
                                if (API_URL && API_URL !== prevUrl) {
                                    showNotification(`Endpoint not found (404). Retrying using detected API: ${API_URL}`, 'warning');
                                    console.info('Retrying POST to newly detected API_URL', API_URL);
                                    const retryResp = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, mode: 'cors', body: JSON.stringify(formData) });
                                    let retryData = null; try { retryData = await retryResp.json(); } catch (e) { retryData = { text: await retryResp.text() }; }
                                    if (retryResp.ok && retryData && retryData.ok) {
                                        showNotification('Message sent successfully (via detected API)!', 'success');
                                        contactForm.reset();
                                        if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Send Message'; }
                                        return;
                                    } else {
                                        console.error('Retry failed', retryResp.status, retryData);
                                    }
                                }
                            } catch (e) { /* ignore retry failures */ }
                        }

                        // Forced fallback: if running on loopback (localhost/127.0.0.1) and still 404, try posting directly to http://localhost:3001/api/users once
                        try {
                            const host = window.location.hostname;
                            if (['localhost','127.0.0.1','::1'].includes(host) && API_URL !== 'http://localhost:3001/api/users') {
                                showNotification('Endpoint not found (404). Force-retrying to http://localhost:3001/api/users', 'warning');
                                console.info('Force retrying POST to http://localhost:3001/api/users');
                                const forceResp = await fetch('http://localhost:3001/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, mode: 'cors', body: JSON.stringify(formData) });
                                let forceData = null; try { forceData = await forceResp.json(); } catch (e) { forceData = { text: await forceResp.text() }; }
                                if (forceResp.ok && forceData && forceData.ok) {
                                    showNotification('Message sent successfully (via localhost:3001)!', 'success');
                                    contactForm.reset();
                                    if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Send Message'; }
                                    return;
                                }
                                console.warn('Force retry did not succeed', forceResp.status, forceData);
                            }
                        } catch (forceErr) { console.warn('Force retry error', forceErr); }


                        // If we reach here, show a helpful diagnostic message
                        const hintParts = [];
                        if (echoRes && echoRes.status === 405) hintParts.push('The host looks like a static dev server (e.g., Live Server) which does not provide /api routes. Start the API (npm start) or set API_URL.');
                        if (rootOk) hintParts.push('A server responded at the origin but /api/users is missing - check your deployment or serverless routes.');
                        if (!echoRes && !rootOk) hintParts.push('No API detected at the origin; start the API locally or deploy backend.');

                        showNotification(`Error 404: endpoint not found. ${hintParts.join(' ')}`, 'error');

                    } catch (diagErr) {
                        console.error('Diagnostics failed', diagErr);
                        showNotification('Error 404: endpoint not found and diagnostics failed. Ensure your API is deployed and accepts POST at /api/users.', 'error');
                    }

                    console.error('Contact form final 404 body:', bodyText);
                } else if (resp.status >= 400) {
                    showNotification(`Error sending message. HTTP ${resp.status}`, 'error');
                    console.error('Contact form error response', resp.status, data);
                } else {
                    showNotification('Error sending message. Please try again.', 'error');
                    console.error('Contact form unexpected response', resp.status, data);
                }
            } catch (err) {
                // Provide a helpful message when network is unreachable
                const serverMessage = err && err.message;
                if (serverMessage && serverMessage !== 'Failed to fetch') {
                    showNotification(`Network error: ${serverMessage}`, 'error');
                } else {
                    showNotification('Could not reach the contact API. Please ensure the dev API is running on port 3000 or 3001.', 'error');
                }
                console.error('Contact form submit error', err);
            } finally {
                if (submitButton) { submitButton.disabled = false; submitButton.textContent = 'Send Message'; }
            }
        });
    }

    // CV Download (safe selector)
    const cvBtn = document.querySelector('.secondary-btn');
    if (cvBtn) {
        cvBtn.addEventListener('click', async function (e) {
            if (!this.href) return; // default navigation
            // If it's a Google Drive link, try to fetch
            if (this.href.includes('drive.google.com')) {
                e.preventDefault();
                try {
                    const fileId = '1HK3VHJJyg1T5GFYN4NjKqn4s84SypyKP';
                    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                    const response = await fetch(downloadUrl);
                    const blob = await response.blob();
                    const downloadLink = document.createElement('a');
                    downloadLink.href = URL.createObjectURL(blob);
                    downloadLink.download = 'Onah_Stephen_CV.pdf';
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    downloadLink.remove();
                    showNotification('CV downloaded successfully!', 'success');
                } catch (error) {
                    showNotification('Download failed. Please try again.', 'error');
                }
            }
        });
    }

    // Notification helper
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        Object.assign(notification.style, {
            position: 'fixed', top: '20px', right: '20px', padding: '1rem 1.5rem', borderRadius: '5px',
            color: '#fff', backgroundColor: type === 'success' ? '#28a745' : '#dc3545', zIndex: 10000, opacity: 0, transition: '0.3s ease'
        });
        document.body.appendChild(notification);
        setTimeout(() => notification.style.opacity = '1', 10);
        setTimeout(() => { notification.style.opacity = '0'; setTimeout(() => notification.remove(), 300); }, 3000);
    }
});
