document.addEventListener('DOMContentLoaded', () => {
    // --- Mobile Menu Toggle ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const menuIcon = document.getElementById('menu-icon');
    const navLinks = document.querySelectorAll('.s-mobile-link');

    if (mobileMenuBtn && mobileMenu && menuIcon) {
        mobileMenuBtn.addEventListener('click', () => {
            const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
            mobileMenuBtn.setAttribute('aria-expanded', String(!isExpanded));
            mobileMenu.classList.toggle('open');
            
            if (isExpanded) {
                menuIcon.classList.remove('fa-times');
                menuIcon.classList.add('fa-bars');
            } else {
                menuIcon.classList.remove('fa-bars');
                menuIcon.classList.add('fa-times');
            }
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.remove('open');
                menuIcon.classList.add('fa-bars');
                menuIcon.classList.remove('fa-times');
                mobileMenuBtn.setAttribute('aria-expanded', 'false');
            });
        });
    }

    // --- Navbar Scroll Effect ---
    window.addEventListener('scroll', () => {
        const navbar = document.getElementById('navbar');
        if (navbar) {
            if (window.scrollY > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        }
    }, { passive: true });

    // --- SPA Router Logic ---
    function handleRouting() {
        const hash = window.location.hash || '#hero';
        const sections = document.querySelectorAll('.tab-section');
        
        sections.forEach(sec => {
            if ('#' + sec.id === hash) {
                sec.style.display = 'block';
            } else {
                sec.style.display = 'none';
            }
        });
        
        // Show the Sertai section along with Hero if we are on the Home page
        const sertaiSec = document.getElementById('sertai');
        if (hash === '#hero' && sertaiSec) {
            sertaiSec.style.display = 'block';
        }

        // Update nav links active state
        document.querySelectorAll('.s-nav-link, .s-mobile-link').forEach(link => {
            if (link.getAttribute('href') === hash) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // Scroll to top when changing tabs
        window.scrollTo(0,0);
    }

    window.addEventListener('hashchange', handleRouting);
    // Initial route check
    handleRouting();

    // --- Entrance Animations (Intersection Observer) ---
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationPlayState = 'running';
                    entry.target.style.opacity = '1'; // Ensure it becomes visible
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.s-entrance').forEach(el => {
            el.style.animationPlayState = 'paused';
            el.style.opacity = '0'; // Start hidden
            observer.observe(el);
        });
    }

    // --- Bilingual Language Toggle ---
    const langBtns = document.querySelectorAll('.lang-btn');
    let currentLang = 'my'; // Default language

    function updateLanguage(lang) {
        if (!window.translations || !window.translations[lang]) return;
        
        currentLang = lang;
        const dict = window.translations[lang];

        // Update all elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) {
                el.innerHTML = dict[key];
            }
        });

        // Update active button state
        langBtns.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Save preference (optional, but good for UX)
        try {
            localStorage.setItem('preferredLang', lang);
        } catch(e) {}
    }

    // Add click events to language buttons
    langBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = btn.getAttribute('data-lang');
            updateLanguage(lang);
        });
    });

    // Check for saved preference
    try {
        const savedLang = localStorage.getItem('preferredLang');
        if (savedLang && (savedLang === 'my' || savedLang === 'en')) {
            updateLanguage(savedLang);
        }
    } catch(e) {}

    // --- Date Display (Gregorian & Hijri) ---
    const gregorianEl = document.getElementById('gregorian-date');
    const hijriEl = document.getElementById('hijri-date');
    if (gregorianEl && hijriEl) {
        const today = new Date();
        const gregorianOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        gregorianEl.textContent = today.toLocaleDateString('ms-MY', gregorianOptions);
        
        try {
            // Use Intl.DateTimeFormat for Hijri calendar
            const hijriFormatter = new Intl.DateTimeFormat('ms-MY-u-ca-islamic', {
                day: 'numeric', month: 'long', year: 'numeric'
            });
            hijriEl.textContent = hijriFormatter.format(today);
        } catch(e) {
            hijriEl.style.display = 'none'; // Fallback if unsupported
        }
    }

    // --- Waktu Solat (JAKIM e-Solat) Fetch ---
    const fetchSolatTimes = async (lat, lon) => {
        try {
            const url = lat && lon 
                ? `https://api.waktusolat.app/v2/solat/gps/${lat}/${lon}`
                : `https://api.waktusolat.app/v2/solat/NGS02`; // Default to Rembau/Seremban Zone
                
            const response = await fetch(url);
            const data = await response.json();
            
            if (data && data.prayers) {
                const todayDate = new Date().getDate();
                const todayPrayer = data.prayers.find(p => p.day === todayDate);
                
                if (todayPrayer) {
                    const map = {
                        'waktu-subuh': todayPrayer.fajr,
                        'waktu-zohor': todayPrayer.dhuhr,
                        'waktu-asar': todayPrayer.asr,
                        'waktu-maghrib': todayPrayer.maghrib,
                        'waktu-isyak': todayPrayer.isha
                    };
                    for (const [id, unixTs] of Object.entries(map)) {
                        const el = document.getElementById(id);
                        if (el) el.textContent = formatUnixTo12Hour(unixTs);
                    }
                }
            }
        } catch(error) {
            console.error('Error fetching solat times:', error);
        }
    };
    
    // Helper to format unix timestamp to 12h time
    function formatUnixTo12Hour(unixTs) {
        if (!unixTs) return '-';
        const d = new Date(unixTs * 1000);
        let h = d.getHours();
        let min = d.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        h = h ? h : 12;
        min = min < 10 ? '0' + min : min;
        return `${h}:${min} ${ampm}`;
    }

    // Init Solat with Geolocation
    const locSpan = document.getElementById('f-solat-location');
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                if(locSpan) locSpan.textContent = "Lokasi Semasa";
                fetchSolatTimes(lat, lon);
                
                // Attempt reverse geocoding for a friendlier name
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
                    const geo = await res.json();
                    if(geo && geo.address) {
                        const place = geo.address.city || geo.address.town || geo.address.village || geo.address.county || "Lokasi Semasa";
                        if(locSpan) locSpan.textContent = place;
                    }
                } catch(e){}
            },
            (error) => {
                if(locSpan) locSpan.textContent = "Waktu Solat";
                fetchSolatTimes(); // fallback to Rembau
            },
            { timeout: 10000 }
        );
    } else {
        if(locSpan) locSpan.textContent = "Waktu Solat";
        fetchSolatTimes();
    }

    // --- Floating Solat Widget Toggle ---
    const fToggle = document.getElementById('f-solat-toggle');
    const fWidget = document.getElementById('floating-solat');
    if(fToggle && fWidget) {
        fToggle.addEventListener('click', () => {
            fWidget.classList.toggle('minimized');
        });
        
        // Start minimized on mobile to save space
        if(window.innerWidth < 768) {
            fWidget.classList.add('minimized');
        }
    }

    // --- Join Form Submission Handler ---
    const joinForm = document.getElementById('join-form');
    const joinSuccess = document.getElementById('join-success');
    if (joinForm && joinSuccess) {
        joinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate form submission
            joinForm.style.display = 'none';
            joinSuccess.style.display = 'block';
            
            // Optionally clear the form
            joinForm.reset();
        });
    }

    // --- Org Chart Accordion Logic ---
    const accordions = document.querySelectorAll('.org-accordion-btn');
    accordions.forEach(acc => {
        acc.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                panel.classList.remove('active');
            } else {
                panel.classList.add('active');
                panel.style.maxHeight = panel.scrollHeight + 40 + "px";
            }
        });
    });
});
