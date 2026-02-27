class LightboxManager {
    constructor() {
        this.currentImages = [];
        this.currentIndex = 0;
        this.isOpen = false;
        this.infoVisible = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupKeyboardNavigation();
        this.setupTouchGestures();
    }

    setupEventListeners() {
        const lightbox = document.getElementById('lightbox');
        const closeLightbox = document.getElementById('closeLightbox');
        const prevImage = document.getElementById('prevImage');
        const nextImage = document.getElementById('nextImage');
        const toggleLightboxInfo = document.getElementById('toggleLightboxInfo');
        const deleteImageBtn = document.getElementById('deleteImageBtn');
        const editItemBtn = document.getElementById('editItemBtn');

        closeLightbox.addEventListener('click', () => this.close());
        prevImage.addEventListener('click', () => this.previous());
        nextImage.addEventListener('click', () => this.next());
        toggleLightboxInfo.addEventListener('click', () => this.toggleInfoPanel());
        deleteImageBtn.addEventListener('click', () => this.deleteCurrentImage());
        editItemBtn.addEventListener('click', () => this.editCurrentImage());

        // Close on background click
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox) {
                this.close();
            }
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.previous();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
                case 'Delete':
                    if (localStorage.getItem('userRole') === 'admin') {
                        this.deleteCurrentImage();
                    }
                    break;
            }
        });
    }

    setupTouchGestures() {
        const lightboxImage = document.getElementById('lightboxImage');
        
        // Touch events for swipe navigation
        lightboxImage.addEventListener('touchstart', (e) => {
            this.startX = e.touches[0].clientX;
            this.startY = e.touches[0].clientY;
        }, { passive: true });

        lightboxImage.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.currentX = e.touches[0].clientX;
            this.currentY = e.touches[0].clientY;
        });

        lightboxImage.addEventListener('touchend', (e) => {
            const diffX = this.startX - this.currentX;
            const diffY = this.startY - this.currentY;
            const threshold = 50;

            if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > threshold) {
                if (diffX > 0) {
                    this.next();
                } else {
                    this.previous();
                }
            }
        }, { passive: true });

        // Pinch to zoom (basic implementation)
        let initialDistance = 0;
        let currentScale = 1;

        lightboxImage.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialDistance = this.getDistance(e.touches[0], e.touches[1]);
            }
        }, { passive: true });

        lightboxImage.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2) {
                e.preventDefault();
                const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
                const scale = currentDistance / initialDistance;
                currentScale = Math.min(Math.max(scale, 0.5), 3);
                lightboxImage.style.transform = `scale(${currentScale})`;
            }
        });

        lightboxImage.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                currentScale = 1;
                lightboxImage.style.transform = 'scale(1)';
            }
        }, { passive: true });
    }

    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    open(images, index = 0) {
        const selected = images[index];
        const imagesWithData = images.filter((img) => img?.thumbnail || img?.data);
        const selectedIndex = imagesWithData.findIndex((img) => img.id === selected?.id);

        this.currentImages = imagesWithData;
        this.currentIndex = selectedIndex >= 0 ? selectedIndex : 0;
        if (!this.currentImages.length) {
            return;
        }
        this.isOpen = true;
        this.infoVisible = false;

        const lightbox = document.getElementById('lightbox');
        lightbox.classList.remove('hidden');
        
        this.updateImage();
        this.updateNavigation();
        this.updateAdminControls();
        this.updateInfoPanel();
        
        // Prevent body scrolling
        document.body.style.overflow = 'hidden';
        
        // Add animation
        lightbox.style.animation = 'fadeIn 0.3s ease';
    }

    close() {
        this.isOpen = false;
        const lightbox = document.getElementById('lightbox');
        
        lightbox.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            lightbox.classList.add('hidden');
            lightbox.style.animation = '';
        }, 300);
        
        // Restore body scrolling
        document.body.style.overflow = '';
        
        // Reset image transform
        const lightboxImage = document.getElementById('lightboxImage');
        lightboxImage.style.transform = 'scale(1)';
        this.infoVisible = false;
        this.updateInfoPanel();
    }

    previous() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.updateImage();
            this.updateNavigation();
        }
    }

    next() {
        if (this.currentIndex < this.currentImages.length - 1) {
            this.currentIndex++;
            this.updateImage();
            this.updateNavigation();
        }
    }

    updateImage() {
        const image = this.currentImages[this.currentIndex];
        if (!image) {
            return;
        }
        const lightboxImage = document.getElementById('lightboxImage');
        const lightboxTitle = document.getElementById('lightboxTitle');
        const lightboxDescription = document.getElementById('lightboxDescription');
        const lightboxPrice = document.getElementById('lightboxPrice');
        const lightboxSpecs = document.getElementById('lightboxSpecs');
        const lightboxTag = document.getElementById('lightboxTag');
        const lightboxSubcategory = document.getElementById('lightboxSubcategory');
        const lightboxGoldType = document.getElementById('lightboxGoldType');
        const lightboxWeight = document.getElementById('lightboxWeight');
        const lightboxGst = document.getElementById('lightboxGst');

        // Add loading animation
        lightboxImage.style.opacity = '0.5';
        
        lightboxImage.onload = () => {
            lightboxImage.style.opacity = '1';
        };
        
        lightboxImage.src = image.thumbnail || image.data;
        lightboxImage.alt = image.title;
        lightboxTitle.textContent = image.title;
        lightboxDescription.textContent = image.description || '';
        
        if (image.price) {
            lightboxPrice.textContent = image.price;
            lightboxPrice.style.display = 'block';
        } else {
            lightboxPrice.style.display = 'none';
        }

        const hasSpecs = Boolean(image.tagNumber || image.subcategoryName || image.goldType || image.weight || image.gst);
        if (hasSpecs) {
            lightboxTag.textContent = image.tagNumber || '-';
            lightboxSubcategory.textContent = image.subcategoryName || '-';
            lightboxGoldType.textContent = image.goldType || '-';
            lightboxWeight.textContent = image.weight || '-';
            lightboxGst.textContent = image.gst || '-';
            lightboxSpecs.classList.remove('hidden');
        } else {
            lightboxSpecs.classList.add('hidden');
        }
    }

    toggleInfoPanel() {
        this.infoVisible = !this.infoVisible;
        this.updateInfoPanel();
    }

    updateInfoPanel() {
        const infoPanel = document.getElementById('lightboxInfoPanel');
        const infoToggle = document.getElementById('toggleLightboxInfo');
        if (this.infoVisible) {
            infoPanel.classList.remove('hidden');
            infoToggle.classList.add('active');
            infoToggle.setAttribute('aria-label', 'Hide details');
        } else {
            infoPanel.classList.add('hidden');
            infoToggle.classList.remove('active');
            infoToggle.setAttribute('aria-label', 'Show details');
        }
    }

    updateNavigation() {
        const prevBtn = document.getElementById('prevImage');
        const nextBtn = document.getElementById('nextImage');

        prevBtn.style.display = this.currentIndex === 0 ? 'none' : 'flex';
        nextBtn.style.display = this.currentIndex === this.currentImages.length - 1 ? 'none' : 'flex';
    }

    updateAdminControls() {
        const adminControls = document.getElementById('lightboxAdmin');
        const userRole = localStorage.getItem('userRole');

        if (userRole === 'admin') {
            adminControls.classList.remove('hidden');
        } else {
            adminControls.classList.add('hidden');
        }
    }

    async deleteCurrentImage() {
        if (localStorage.getItem('userRole') !== 'admin') {
            return;
        }

        const image = this.currentImages[this.currentIndex];
        
        if (confirm(`Are you sure you want to delete "${image.title}"?`)) {
            try {
                await window.dbManager.deleteImage(image.id);
                
                // Remove from current images array
                this.currentImages.splice(this.currentIndex, 1);
                
                if (this.currentImages.length === 0) {
                    this.close();
                } else {
                    // Adjust index if needed
                    if (this.currentIndex >= this.currentImages.length) {
                        this.currentIndex = this.currentImages.length - 1;
                    }
                    this.updateImage();
                    this.updateNavigation();
                }
                
                // Refresh gallery and categories
                await window.gallery.refreshGallery();
                await window.gallery.refreshCategories();
                window.gallery.showSuccess('Item deleted successfully');
                
            } catch (error) {
                console.error('Error deleting image:', error);
                window.gallery.showError('Failed to delete item');
            }
        }
    }

    async editCurrentImage() {
        if (localStorage.getItem('userRole') !== 'admin') {
            return;
        }

        const image = this.currentImages[this.currentIndex];
        
        // Create a simple edit modal
        const newTitle = prompt('Edit title:', image.title);
        if (newTitle === null) return; // User cancelled
        
        const newDescription = prompt('Edit description:', image.description || '');
        if (newDescription === null) return; // User cancelled
        
        const newPrice = prompt('Edit price:', image.price || '');
        if (newPrice === null) return; // User cancelled
        
        const newTagNumber = prompt('Edit tag number:', image.tagNumber || '');
        if (newTagNumber === null) return; // User cancelled
        
        const newGoldType = prompt('Edit gold type:', image.goldType || '');
        if (newGoldType === null) return; // User cancelled

        const newWeight = prompt('Edit weight:', image.weight || '');
        if (newWeight === null) return; // User cancelled

        const newGst = prompt('Edit GST:', image.gst || '');
        if (newGst === null) return; // User cancelled

        try {
            const updateData = {
                title: newTitle.trim() || image.title,
                description: newDescription.trim(),
                price: newPrice.trim(),
                tagNumber: newTagNumber.trim().toUpperCase(),
                goldType: newGoldType.trim(),
                weight: newWeight.trim(),
                gst: newGst.trim()
            };

            await window.dbManager.updateImage(image.id, updateData);
            
            // Update current image data
            Object.assign(image, updateData);
            this.updateImage();
            
            // Refresh gallery
            await window.gallery.refreshGallery();
            window.gallery.showSuccess('Item updated successfully');
            
        } catch (error) {
            console.error('Error updating image:', error);
            window.gallery.showError('Failed to update item');
        }
    }
}

// Add CSS animations for lightbox
const lightboxStyle = document.createElement('style');
lightboxStyle.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
    
    .lightbox-image {
        transition: opacity 0.3s ease, transform 0.3s ease;
    }
    
    .lightbox-nav,
    .lightbox-close {
        transition: all 0.3s ease;
    }
    
    .lightbox-nav:active,
    .lightbox-close:active {
        transform: scale(0.95);
    }
`;
document.head.appendChild(lightboxStyle);

// Initialize lightbox when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.lightbox = new LightboxManager();
});
