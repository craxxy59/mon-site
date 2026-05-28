document.addEventListener('DOMContentLoaded', function () {
    const menuBtn = document.querySelector('.menu-btn');
    const navLink = document.querySelector('.nav-link');
    const header = document.querySelector('header');

    if (menuBtn && navLink) {
        menuBtn.addEventListener('click', () => {
            navLink.classList.toggle('mobile-menu');
        });
    }

    window.addEventListener('scroll', function () {
        if (header) {
            header.classList.toggle('header-js', window.scrollY > 100);
        }
    });

    const revealTargets = document.querySelectorAll('.container, .container2, .containerip, .hero, .card-link');
    if ('IntersectionObserver' in window && revealTargets.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        revealTargets.forEach((el) => {
            el.classList.add('is-reveal');
            observer.observe(el);
        });
    }
});
