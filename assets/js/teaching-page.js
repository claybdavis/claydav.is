/**
 * Teaching Page Functionality
 * Handles evaluation navigation, comment toggles, and score displays
 */

document.addEventListener('DOMContentLoaded', function() {
    const evaluationItems = document.querySelectorAll('.evaluation-item');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    
    if (evaluationItems.length <= 1) return;
    
    let currentIndex = 0;
    
    function updateNavigationButtons() {
        if (prevBtn) {
            prevBtn.disabled = currentIndex <= 0;
        }
        if (nextBtn) {
            nextBtn.disabled = currentIndex >= evaluationItems.length - 1;
        }
    }
    
    function showEvaluation(index) {
        evaluationItems.forEach(item => item.classList.remove('active'));
        evaluationItems[index].classList.add('active');
        
        // Update header by copying from the current evaluation's hidden header data
        const currentItem = evaluationItems[index];
        const headerData = currentItem.querySelector('.evaluation-header-data');
        const carouselHeader = document.querySelector('.carousel-title-middle');
        
        if (headerData && carouselHeader) {
            carouselHeader.innerHTML = headerData.innerHTML;
        }
        
        updateNavigationButtons();
    }
    
    function nextEvaluation() {
        if (currentIndex < evaluationItems.length - 1) {
            currentIndex++;
            showEvaluation(currentIndex);
        }
    }
    
    function prevEvaluation() {
        if (currentIndex > 0) {
            currentIndex--;
            showEvaluation(currentIndex);
        }
    }
    
    if (nextBtn) nextBtn.addEventListener('click', nextEvaluation);
    if (prevBtn) prevBtn.addEventListener('click', prevEvaluation);
    
    // Initialize the first evaluation and navigation buttons
    showEvaluation(currentIndex);
    
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        if (document.querySelector('.teaching-layout:hover')) {
            if (e.key === 'ArrowRight') nextEvaluation();
            if (e.key === 'ArrowLeft') prevEvaluation();
        }
    });
});

// Toggle evaluation visibility
function toggleEvaluations(button) {
    const evaluationScores = button.closest('.evaluation-scores');
    const toggleableItems = evaluationScores.querySelectorAll('.score-item[data-toggleable="true"]');
    const showText = button.querySelector('.show-text');
    const hideText = button.querySelector('.hide-text');
    
    // Check if toggleable items are currently hidden
    const areCurrentlyHidden = toggleableItems[0] && toggleableItems[0].classList.contains('score-item-hidden');
    
    toggleableItems.forEach(item => {
        if (areCurrentlyHidden) {
            item.classList.remove('score-item-hidden');
        } else {
            item.classList.add('score-item-hidden');
        }
    });
    
    if (areCurrentlyHidden) {
        showText.style.display = 'none';
        hideText.style.display = 'inline';
    } else {
        showText.style.display = 'inline';
        hideText.style.display = 'none';
    }
}

// Toggle comment visibility
function toggleComments(button) {
    const commentsContainer = button.closest('.evaluation-comments');
    const showText = button.querySelector('.show-text');
    const hideText = button.querySelector('.hide-text');
    
    const isShowingAll = commentsContainer.classList.contains('show-all');
    
    if (isShowingAll) {
        commentsContainer.classList.remove('show-all');
        showText.style.display = 'inline';
        hideText.style.display = 'none';
    } else {
        commentsContainer.classList.add('show-all');
        showText.style.display = 'none';
        hideText.style.display = 'inline';
    }
}

// Initialize comment buttons
document.addEventListener('DOMContentLoaded', function() {
    const commentSections = document.querySelectorAll('.evaluation-comments');
    commentSections.forEach(section => {
        const paragraphs = section.querySelectorAll('p');
        const button = section.querySelector('.show-more-comments');
        
        if (paragraphs.length > 2 && button) {
            button.style.display = 'block';
            const showText = button.querySelector('.show-text');
            if (showText) {
                showText.textContent = `Show ${paragraphs.length - 2} more reviews`;
            }
        }
    });

    // Set score bar widths based on data attributes
    const scoreFills = document.querySelectorAll('.score-fill[data-percentage]');
    scoreFills.forEach(function(fill) {
        const percentage = fill.getAttribute('data-percentage');
        if (percentage) {
            fill.style.width = percentage + '%';
        }
    });
});