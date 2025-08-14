/**
 * Hamburger Menu Functionality
 * Handles the mobile navigation toggle behavior
 */

document.addEventListener('DOMContentLoaded', function() {
    const hamburgerBtn = document.querySelector('.hamburger-btn');
    const nav = document.querySelector('.nav');
    const header = document.querySelector('.header');
    
    if (!hamburgerBtn || !nav) {
        return; // Exit if elements don't exist
    }
    
    // Toggle mobile menu
    function toggleMenu() {
        const isOpen = nav.classList.contains('nav-open');
        
        if (isOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    // Open mobile menu
    function openMenu() {
        nav.classList.add('nav-open');
        hamburgerBtn.classList.add('hamburger-open');
        hamburgerBtn.setAttribute('aria-expanded', 'true');
        document.body.classList.add('menu-open');
        
        // Focus trap for accessibility
        const navLinks = nav.querySelectorAll('.nav-link');
        if (navLinks.length > 0) {
            navLinks[0].focus();
        }
    }
    
    // Close mobile menu
    function closeMenu() {
        nav.classList.remove('nav-open');
        hamburgerBtn.classList.remove('hamburger-open');
        hamburgerBtn.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('menu-open');
    }
    
    // Event listeners
    hamburgerBtn.addEventListener('click', toggleMenu);
    
    // Page indicator click to open menu
    const pageIndicator = document.querySelector('.page-indicator');
    if (pageIndicator) {
        pageIndicator.addEventListener('click', openMenu);
    }
    
    // Close menu when clicking on nav links
    nav.addEventListener('click', function(e) {
        if (e.target.classList.contains('nav-link')) {
            closeMenu();
        }
    });
    
    // Close menu when clicking outside (only on mobile)
    document.addEventListener('click', function(e) {
        if (window.innerWidth <= 768 && 
            nav.classList.contains('nav-open') && 
            !nav.contains(e.target) && 
            !hamburgerBtn.contains(e.target)) {
            closeMenu();
        }
    });
    
    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
            closeMenu();
            hamburgerBtn.focus();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            closeMenu();
            document.body.classList.remove('menu-open');
        }
    });
});
