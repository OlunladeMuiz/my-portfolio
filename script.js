// Main script for example.html
document.addEventListener('DOMContentLoaded', function () {
    // Initialize AOS if available
    if (typeof AOS !== 'undefined') {
        AOS.init({ duration: 1000, once: true, offset: 100 });
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
    // Configure your API endpoint here. Use the same origin when possible
    // Fallback to localhost so the form works during local development.
    const API_URL = (function () {
        try {
            if (window.location && window.location.origin && window.location.origin !== 'null') {
                return `${window.location.origin}/api/users`;
            }
        } catch (e) {
            // ignore
        }
        return 'http://localhost:3000/api/users';
    })();
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };
            try {
                await axios.post(API_URL, formData);
                showNotification('Message sent successfully!', 'success');
                contactForm.reset();
            } catch (err) {
                showNotification('Error sending message. Please try again.', 'error');
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
