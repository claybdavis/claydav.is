/**
 * Scroll to Top Functionality
 * Handles clicking header area to scroll to top on mobile devices
 */

document.addEventListener('DOMContentLoaded', function() {
    // Scroll to top function
    function scrollToTop() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Get header elements
    const headerContent = document.querySelector('.header-content');
    const nameLink = document.querySelector('.name-link');
    const nav = document.querySelector('.nav');
    
    // Function to handle header click for scroll-to-top
    function handleHeaderClick(e) {
        // Only on mobile screens
        const isMobile = window.innerWidth <= 768 || (window.innerWidth <= 900 && document.body.classList.contains('content-page'));
        
        if (isMobile) {
            // Don't interfere with navigation or menu functionality
            if (e.target.closest('.hamburger-btn') || 
                e.target.closest('.page-indicator') || 
                e.target.closest('.nav') ||
                (nav && nav.classList.contains('nav-open'))) {
                return;
            }
            
            // If clicking on name link and we're not on home page, let the link work normally
            if (e.target.closest('.name-link') && !document.body.classList.contains('home-page')) {
                return;
            }
            
            // Scroll to top for all other header clicks
            e.preventDefault();
            scrollToTop();
        }
    }
    
    // Add event listeners for scroll-to-top
    if (headerContent) {
        headerContent.addEventListener('click', handleHeaderClick);
    }
    
    // Special handling for home page - clicking site title should scroll to top
    if (nameLink && document.body.classList.contains('home-page')) {
        nameLink.addEventListener('click', function(e) {
            const isMobile = window.innerWidth <= 768;
            if (isMobile) {
                e.preventDefault();
                scrollToTop();
            }
        });
    }
});
