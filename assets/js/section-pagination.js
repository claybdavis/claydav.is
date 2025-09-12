/**
 * Section-based pagination for composite list pages
 * Allows independent pagination within different sections on the same page
 */

class SectionPagination {
    constructor(sectionId, itemsPerPage = 6) {
        this.sectionId = sectionId;
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.items = [];
        this.totalPages = 0;
        
        this.init();
    }
    
    init() {
        // Get all items in this section
        const section = document.getElementById(this.sectionId);
        if (!section) return;
        
        const itemsList = section.querySelector('.content-list');
        if (!itemsList) return;
        
        this.items = Array.from(itemsList.children);
        this.totalPages = Math.ceil(this.items.length / this.itemsPerPage);
        
        // Create pagination controls
        this.createPaginationControls(section);
        
        // Show first page
        this.showPage(1);
    }
    
    createPaginationControls(section) {
        if (this.totalPages <= 1) return;
        
        const paginationHTML = `
            <nav class="pagination" data-section="${this.sectionId}">
                <ul>
                    <li class="page-item prev-item">
                        <a href="#" class="page-link" data-action="prev" aria-label="Previous page">
                            <span aria-hidden="true">«</span>
                        </a>
                    </li>
                    ${this.generatePageNumbers()}
                    <li class="page-item next-item">
                        <a href="#" class="page-link" data-action="next" aria-label="Next page">
                            <span aria-hidden="true">»</span>
                        </a>
                    </li>
                </ul>
            </nav>
        `;
        
        // Insert pagination after the content list
        const itemsList = section.querySelector('.content-list');
        itemsList.insertAdjacentHTML('afterend', paginationHTML);
        
        // Add event listeners
        this.addEventListeners(section);
    }
    
    generatePageNumbers() {
        let pageNumbers = '';
        for (let i = 1; i <= this.totalPages; i++) {
            const activeClass = i === this.currentPage ? ' active' : '';
            pageNumbers += `
                <li class="page-item${activeClass}">
                    <a href="#" class="page-link" data-page="${i}">${i}</a>
                </li>
            `;
        }
        return pageNumbers;
    }
    
    addEventListeners(section) {
        const pagination = section.querySelector('.pagination');
        if (!pagination) return;
        
        pagination.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.closest('.page-link');
            if (!target) return;
            
            const action = target.dataset.action;
            const page = target.dataset.page;
            
            if (action === 'prev' && this.currentPage > 1) {
                this.showPage(this.currentPage - 1);
            } else if (action === 'next' && this.currentPage < this.totalPages) {
                this.showPage(this.currentPage + 1);
            } else if (page) {
                this.showPage(parseInt(page));
            }
        });
    }
    
    showPage(pageNumber) {
        if (pageNumber < 1 || pageNumber > this.totalPages) return;
        
        this.currentPage = pageNumber;
        
        // Hide all items
        this.items.forEach(item => {
            item.style.display = 'none';
        });
        
        // Show items for current page
        const startIndex = (pageNumber - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        
        for (let i = startIndex; i < endIndex && i < this.items.length; i++) {
            this.items[i].style.display = '';
        }
        
        // Update pagination controls
        this.updatePaginationControls();
    }
    
    updatePaginationControls() {
        const section = document.getElementById(this.sectionId);
        const pagination = section.querySelector('.pagination');
        if (!pagination) return;
        
        // Update active page
        pagination.querySelectorAll('.page-item').forEach(item => {
            item.classList.remove('active');
            const link = item.querySelector('.page-link');
            if (link && link.dataset.page == this.currentPage) {
                item.classList.add('active');
            }
        });
        
        // Update prev/next button states
        const prevItem = pagination.querySelector('.prev-item');
        const nextItem = pagination.querySelector('.next-item');
        
        if (prevItem) {
            if (this.currentPage <= 1) {
                prevItem.classList.add('disabled');
            } else {
                prevItem.classList.remove('disabled');
            }
        }
        
        if (nextItem) {
            if (this.currentPage >= this.totalPages) {
                nextItem.classList.add('disabled');
            } else {
                nextItem.classList.remove('disabled');
            }
        }
    }
}

// Manual initialization function - call this from templates that need pagination
function initSectionPagination(sectionId, itemsPerPage = 5) {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new SectionPagination(sectionId, itemsPerPage);
        });
    } else {
        new SectionPagination(sectionId, itemsPerPage);
    }
}
