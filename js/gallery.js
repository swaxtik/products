class GalleryManager {
    constructor() {
        this.uncategorizedId = '__uncategorized__';
        this.currentImages = [];
        this.filteredImages = [];
        this.currentCategory = null;
        this.currentSubcategory = 'all';
        this.currentSubcategories = [];
        this.categoryScreenMode = 'subcategories';
        this.userRole = localStorage.getItem('userRole');
        this.currentView = 'categories'; // 'categories' or 'gallery'
        this.init();
    }

    async init() {
        // Wait for database to be ready
        await window.dbManager.init();
        
        this.setupEventListeners();
        this.setupAuth();
        await this.loadCategories();
    }

    setupEventListeners() {
        const logoutBtn = document.getElementById('logoutBtn');
        const backToCategories = document.getElementById('backToCategories');
        const subcategoryFilter = document.getElementById('subcategoryFilter');
        const closeDetailsModal = document.getElementById('closeDetailsModal');
        const detailsModal = document.getElementById('productDetailsModal');
        const backToSubcategories = document.getElementById('backToSubcategories');

        logoutBtn.addEventListener('click', () => this.logout());
        backToCategories.addEventListener('click', () => this.showCategoriesView());
        subcategoryFilter.addEventListener('change', (e) => {
            this.currentSubcategory = e.target.value;
            if (this.currentSubcategory === 'all') {
                this.showSubcategoryOnlyView();
            } else {
                this.showProductsForCurrentSubcategory();
            }
        });
        closeDetailsModal.addEventListener('click', () => this.closeDetailsModal());
        backToSubcategories.addEventListener('click', () => this.showSubcategoryOnlyView());
        detailsModal.addEventListener('click', (e) => {
            if (e.target === detailsModal) {
                this.closeDetailsModal();
            }
        });
    }

    setupAuth() {
        const userRole = localStorage.getItem('userRole');
        const userRoleDisplay = document.getElementById('userRole');
        const adminCategoryControls = document.getElementById('adminCategoryControls');
        const adminGalleryControls = document.getElementById('adminGalleryControls');

        if (!userRole) {
            window.location.href = 'index.html';
            return;
        }

        const roleText = userRole === 'admin' ? 'Store Owner' : 'Customer';
        userRoleDisplay.textContent = roleText;

        if (userRole === 'admin') {
            adminCategoryControls.classList.remove('hidden');
            adminGalleryControls.classList.remove('hidden');
        }

        this.userRole = userRole;
    }

    async loadCategories() {
        try {
            const categories = await window.dbManager.getCategories();
            await this.renderCategories(categories);
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showError('Failed to load collections');
        }
    }

    async renderCategories(categories) {
        const categoriesGrid = document.getElementById('categoriesGrid');
        const emptyState = document.getElementById('emptyCategoriesState');

        if (categories.length === 0) {
            categoriesGrid.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        const categoryCards = await Promise.all(categories.map(async (category) => {
            const imageCount = await window.dbManager.getCategoryImageCount(category.id);
            return this.createCategoryCard(category, imageCount);
        }));

        categoriesGrid.innerHTML = categoryCards.join('');

        // Add click event listeners to category cards
        categoriesGrid.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.category-admin-controls')) return;
                const categoryId = card.dataset.categoryId;
                const categoryName = card.dataset.categoryName;
                this.showGalleryView(categoryId, categoryName);
            });
        });

        // Add admin control listeners
        if (this.userRole === 'admin') {
            categoriesGrid.querySelectorAll('.edit-category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const categoryId = e.target.closest('.category-card').dataset.categoryId;
                    this.editCategory(categoryId);
                });
            });

            categoriesGrid.querySelectorAll('.delete-category-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const categoryId = e.target.closest('.category-card').dataset.categoryId;
                    const categoryName = e.target.closest('.category-card').dataset.categoryName;
                    this.deleteCategory(categoryId, categoryName);
                });
            });
        }
    }

    createCategoryCard(category, imageCount) {
        const adminControls = this.userRole === 'admin' ? `
            <div class="category-admin-controls">
                <button class="btn btn-secondary edit-category-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Edit
                </button>
                <button class="btn btn-danger delete-category-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3,6 5,6 21,6"/>
                        <path d="M19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1 2-2h4a2,2 0 0,1 2,2v2"/>
                    </svg>
                    Delete
                </button>
            </div>
        ` : '';

        return `
            <div class="category-card" data-category-id="${category.id}" data-category-name="${category.name}">
                <img src="${category.image}" alt="${category.name}" class="category-image" loading="lazy">
                <div class="category-info">
                    <h3 class="category-title">${category.name}</h3>
                    <p class="category-description">${category.description}</p>
                    <div class="category-stats">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 3h12l4 6-10 11-10-11 4-6z"/>
                            <path d="M11 3h2"/>
                        </svg>
                        ${imageCount} item${imageCount !== 1 ? 's' : ''}
                    </div>
                    ${adminControls}
                </div>
            </div>
        `;
    }

    showCategoriesView() {
        const categoriesView = document.getElementById('categoriesView');
        const galleryView = document.getElementById('galleryView');
        
        categoriesView.classList.remove('hidden');
        galleryView.classList.add('hidden');
        this.currentView = 'categories';
        this.currentCategory = null;
        this.currentSubcategory = 'all';
        this.currentSubcategories = [];
        this.categoryScreenMode = 'subcategories';
    }

    async showGalleryView(categoryId, categoryName) {
        const categoriesView = document.getElementById('categoriesView');
        const galleryView = document.getElementById('galleryView');
        const currentCategoryTitle = document.getElementById('currentCategoryTitle');
        
        categoriesView.classList.add('hidden');
        galleryView.classList.remove('hidden');
        currentCategoryTitle.textContent = categoryName;
        
        this.currentView = 'gallery';
        this.currentCategory = categoryId;
        this.currentSubcategory = 'all';
        this.categoryScreenMode = 'subcategories';
        
        await this.loadSubcategories(categoryId);
        await this.loadImages(categoryId);
        this.showSubcategoryOnlyView();
    }

    async loadSubcategories(categoryId) {
        try {
            this.currentSubcategories = await window.dbManager.getSubcategories(categoryId);
            this.renderSubcategoryFilter();
        } catch (error) {
            console.error('Error loading sub-categories:', error);
            this.currentSubcategories = [];
            this.renderSubcategoryFilter();
        }
    }

    renderSubcategoryFilter() {
        const subcategoryFilter = document.getElementById('subcategoryFilter');
        const baseOption = '<option value="all">All Sub-Categories</option>';
        const options = this.currentSubcategories.map((sub) => `<option value="${sub.id}">${sub.name}</option>`);
        if (this.hasUncategorizedProducts()) {
            options.push(`<option value="${this.uncategorizedId}">Uncategorized</option>`);
        }
        subcategoryFilter.innerHTML = baseOption + options.join('');
        const existsInDefinedSubs = this.currentSubcategories.some((sub) => sub.id === this.currentSubcategory);
        const isUncategorizedSelected = this.currentSubcategory === this.uncategorizedId && this.hasUncategorizedProducts();
        const exists = existsInDefinedSubs || isUncategorizedSelected || this.currentSubcategory === 'all';
        if (!exists) {
            this.currentSubcategory = 'all';
        }
        subcategoryFilter.value = this.currentSubcategory || 'all';
        this.renderSubcategoryCards();
    }

    showSubcategoryOnlyView() {
        this.categoryScreenMode = 'subcategories';
        this.currentSubcategory = 'all';
        document.getElementById('subcategoryFilter').value = 'all';
        document.querySelector('.subcategory-toolbar label').classList.add('hidden');
        document.getElementById('subcategoryFilter').classList.add('hidden');
        document.getElementById('subcategoryCards').classList.remove('hidden');
        document.getElementById('gallery').classList.add('hidden');
        document.getElementById('emptyGalleryState').classList.add('hidden');
        document.getElementById('backToSubcategories').classList.add('hidden');
        this.renderSubcategoryCards();
    }

    showProductsForCurrentSubcategory() {
        this.categoryScreenMode = 'products';
        document.querySelector('.subcategory-toolbar label').classList.remove('hidden');
        document.getElementById('subcategoryFilter').classList.remove('hidden');
        document.getElementById('subcategoryCards').classList.add('hidden');
        document.getElementById('gallery').classList.remove('hidden');
        document.getElementById('backToSubcategories').classList.remove('hidden');
        this.renderGallery(this.currentImages);
    }

    renderSubcategoryCards() {
        const container = document.getElementById('subcategoryCards');
        const cards = [
            `
                <button class="subcategory-card ${this.currentSubcategory === 'all' ? 'active' : ''}" data-subcategory-id="all" type="button">
                    <div class="subcategory-card-image subcategory-fallback">All</div>
                    <div class="subcategory-card-content">
                        <h4>All Sub-Categories</h4>
                    </div>
                </button>
            `
        ];

        for (const sub of this.currentSubcategories) {
            const imageNode = sub.image
                ? `<img src="${sub.image}" alt="${sub.name}" class="subcategory-card-image">`
                : `<div class="subcategory-card-image subcategory-fallback">${(sub.name || '').slice(0, 1).toUpperCase() || '?'}</div>`;
            cards.push(`
                <button class="subcategory-card ${this.currentSubcategory === sub.id ? 'active' : ''}" data-subcategory-id="${sub.id}" type="button">
                    ${imageNode}
                    <div class="subcategory-card-content">
                        <h4>${sub.name}</h4>
                        ${sub.description ? `<p>${sub.description}</p>` : ''}
                    </div>
                </button>
            `);
        }

        if (this.hasUncategorizedProducts()) {
            cards.push(`
                <button class="subcategory-card ${this.currentSubcategory === this.uncategorizedId ? 'active' : ''}" data-subcategory-id="${this.uncategorizedId}" type="button">
                    <div class="subcategory-card-image subcategory-fallback">U</div>
                    <div class="subcategory-card-content">
                        <h4>Uncategorized</h4>
                        <p>Products without sub-category</p>
                    </div>
                </button>
            `);
        }

        container.innerHTML = cards.join('');
        container.querySelectorAll('.subcategory-card').forEach((card) => {
            card.addEventListener('click', () => {
                const subcategoryId = card.dataset.subcategoryId;
                if (subcategoryId === 'all') {
                    this.showSubcategoryOnlyView();
                    return;
                }
                this.currentSubcategory = subcategoryId;
                document.getElementById('subcategoryFilter').value = this.currentSubcategory;
                this.showProductsForCurrentSubcategory();
            });
        });
    }

    async loadImages(categoryId) {
        try {
            const images = await window.dbManager.getImages(categoryId);
            this.currentImages = images;
            this.renderSubcategoryFilter();
            this.renderGallery(images);
        } catch (error) {
            console.error('Error loading images:', error);
            this.showError('Failed to load jewelry items');
        }
    }

    renderGallery(images) {
        const gallery = document.getElementById('gallery');
        const emptyState = document.getElementById('emptyGalleryState');

        if (this.currentSubcategory === 'all') {
            gallery.innerHTML = '';
            emptyState.classList.add('hidden');
            return;
        }

        const filteredImages = this.currentSubcategory === this.uncategorizedId
            ? images.filter((image) => !image.subcategoryId)
            : images.filter((image) => image.subcategoryId === this.currentSubcategory);
        this.filteredImages = filteredImages;

        if (filteredImages.length === 0) {
            gallery.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        
        gallery.innerHTML = filteredImages.map((image, index) => `
            <div class="gallery-item" data-index="${index}" data-id="${image.id}">
                ${image.thumbnail || image.data
                    ? `<img src="${image.thumbnail || image.data}" alt="${image.title}" loading="lazy">`
                    : `<div class="gallery-item-no-image">No Image Yet</div>`
                }
                <div class="gallery-item-info">
                    <div class="gallery-item-title">${image.title}</div>
                    <div class="gallery-item-actions">
                        <button class="btn btn-primary view-image-btn" type="button" ${image.thumbnail || image.data ? '' : 'disabled'}>View Image</button>
                        <button class="btn btn-secondary details-btn" type="button">Details</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click event listeners to gallery items
        gallery.querySelectorAll('.gallery-item').forEach(item => {
            const img = item.querySelector('img');
            const viewImageBtn = item.querySelector('.view-image-btn');
            const detailsBtn = item.querySelector('.details-btn');
            if (img) {
                img.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const index = parseInt(item.dataset.index);
                    window.lightbox.open(filteredImages, index);
                });
            }
            viewImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                const product = filteredImages[index];
                if (product?.thumbnail || product?.data) {
                    window.lightbox.open(filteredImages, index);
                }
            });
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(item.dataset.index);
                this.openDetailsModal(filteredImages[index]);
            });
        });
    }

    openDetailsModal(image) {
        const modal = document.getElementById('productDetailsModal');
        const title = document.getElementById('detailsTitle');
        const detailsImage = document.getElementById('detailsImage');
        const description = document.getElementById('detailsDescription');
        const specs = document.getElementById('detailsSpecs');

        title.textContent = image.title || 'Product Details';
        const detailsImageSource = image.thumbnail || image.data;
        if (detailsImageSource) {
            detailsImage.src = detailsImageSource;
            detailsImage.alt = image.title || 'Product image';
            detailsImage.classList.remove('hidden');
        } else {
            detailsImage.removeAttribute('src');
            detailsImage.alt = 'No product image uploaded yet';
            detailsImage.classList.add('hidden');
        }
        description.textContent = image.description || 'No description available.';

        const rows = [
            { label: 'Tag', value: image.tagNumber },
            { label: 'Sub-Category', value: image.subcategoryName },
            { label: 'Gold Type', value: image.goldType },
            { label: 'Weight', value: image.weight },
            { label: 'GST', value: image.gst },
            { label: 'Price', value: image.price }
        ].filter((row) => row.value);

        specs.innerHTML = rows.length
            ? rows.map((row) => `<div class="details-spec-row"><span>${row.label}</span><strong>${row.value}</strong></div>`).join('')
            : '<div class="details-spec-row"><span>No extra details available.</span></div>';

        modal.classList.remove('hidden');
    }

    closeDetailsModal() {
        const modal = document.getElementById('productDetailsModal');
        modal.classList.add('hidden');
    }

    hasUncategorizedProducts() {
        return (this.currentImages || []).some((image) => !image.subcategoryId);
    }

    async refreshCategories() {
        await this.loadCategories();
    }

    async refreshGallery() {
        if (this.currentCategory) {
            await this.loadSubcategories(this.currentCategory);
            await this.loadImages(this.currentCategory);
        }
    }

    async editCategory(categoryId) {
        // This would open the category modal in edit mode
        window.admin.editCategory(categoryId);
    }

    async deleteCategory(categoryId, categoryName) {
        if (confirm(`Are you sure you want to delete the "${categoryName}" collection? This will also delete all items in this collection.`)) {
            try {
                // First delete all images in this category
                const images = await window.dbManager.getImages(categoryId);
                for (const image of images) {
                    await window.dbManager.deleteImage(image.id);
                }
                
                // Then delete the category
                await window.dbManager.deleteCategory(categoryId);
                await window.dbManager.deleteSubcategoriesByCategory(categoryId);
                
                this.showSuccess(`Collection "${categoryName}" deleted successfully`);
                await this.refreshCategories();
            } catch (error) {
                console.error('Error deleting category:', error);
                this.showError('Failed to delete collection');
            }
        }
    }

    logout() {
        localStorage.removeItem('userRole');
        localStorage.removeItem('authTimestamp');
        window.location.href = 'index.html';
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-notification';
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #FEE2E2;
            border: 1px solid #FECACA;
            color: #DC2626;
            padding: 16px 20px;
            border-radius: 12px;
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(139, 21, 56, 0.15);
            animation: slideIn 0.3s ease;
        `;
        errorDiv.textContent = message;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => errorDiv.remove(), 300);
        }, 3000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-notification';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #D1FAE5;
            border: 1px solid #A7F3D0;
            color: #065F46;
            padding: 16px 20px;
            border-radius: 12px;
            z-index: 1000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(139, 21, 56, 0.15);
            animation: slideIn 0.3s ease;
        `;
        successDiv.textContent = message;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            successDiv.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => successDiv.remove(), 300);
        }, 3000);
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Initialize gallery when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.gallery = new GalleryManager();
});
