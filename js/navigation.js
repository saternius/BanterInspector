export class Navigation {
    constructor() {
        this.currentPage = 'world-inspector';
        this.pages = new Map();
        this.navItems = new Map();
        
        this.init();
    }
    
    init() {
        const pageElements = document.querySelectorAll('.page');
        pageElements.forEach(page => {
            const pageId = page.id.replace('-page', '');
            this.pages.set(pageId, page);
        });
        
        const navElements = document.querySelectorAll('.nav-item');
        navElements.forEach(navItem => {
            const pageId = navItem.getAttribute('data-page');
            this.navItems.set(pageId, navItem);
            
            navItem.addEventListener('click', () => this.switchPage(pageId));
        });
    }
    
    switchPage(pageId) {
        if (pageId === this.currentPage) return;
        
        this.pages.forEach((page, id) => {
            if (id === pageId) {
                page.classList.add('active');
            } else {
                page.classList.remove('active');
            }
        });
        
        this.navItems.forEach((navItem, id) => {
            if (id === pageId) {
                navItem.classList.add('active');
            } else {
                navItem.classList.remove('active');
            }
        });
        
        this.currentPage = pageId;
        
        const event = new CustomEvent('page-switched', { 
            detail: { pageId } 
        });
        window.dispatchEvent(event);
    }
    
    getCurrentPage() {
        return this.currentPage;
    }
}