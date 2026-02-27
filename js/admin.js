class AdminManager {
    constructor() {
        this.currentEditingCategory = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Category management
        const addCategoryBtn = document.getElementById('addCategoryBtn');
        const closeCategoryModal = document.getElementById('closeCategoryModal');
        const cancelCategory = document.getElementById('cancelCategory');
        const saveCategory = document.getElementById('saveCategory');
        const categoryImage = document.getElementById('categoryImage');
        const addSubcategoryBtn = document.getElementById('addSubcategoryBtn');
        const closeSubcategoryModal = document.getElementById('closeSubcategoryModal');
        const cancelSubcategory = document.getElementById('cancelSubcategory');
        const saveSubcategory = document.getElementById('saveSubcategory');
        const subcategoryImage = document.getElementById('subcategoryImage');

        // Upload management
        const openBulkProductBtn = document.getElementById('openBulkProductBtn');
        const openBulkImageBtn = document.getElementById('openBulkImageBtn');
        const uploadModal = document.getElementById('uploadModal');
        const closeUploadModal = document.getElementById('closeUploadModal');
        const cancelUpload = document.getElementById('cancelUpload');
        const confirmUpload = document.getElementById('confirmUpload');
        const fileInput = document.getElementById('fileInput');
        const uploadArea = uploadModal.querySelector('.upload-area');

        // Metadata import management
        const closeMetadataModal = document.getElementById('closeMetadataModal');
        const cancelMetadataImport = document.getElementById('cancelMetadataImport');
        const confirmMetadataImport = document.getElementById('confirmMetadataImport');
        const metadataFileInput = document.getElementById('metadataFileInput');
        const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        const downloadMetadataBtn = document.getElementById('downloadMetadataBtn');

        // Category modal events
        addCategoryBtn.addEventListener('click', () => this.openCategoryModal());
        closeCategoryModal.addEventListener('click', () => this.closeCategoryModal());
        cancelCategory.addEventListener('click', () => this.closeCategoryModal());
        saveCategory.addEventListener('click', () => this.saveCategory());
        categoryImage.addEventListener('change', (e) => this.handleCategoryImageSelection(e));
        addSubcategoryBtn.addEventListener('click', () => this.openSubcategoryModal());
        closeSubcategoryModal.addEventListener('click', () => this.closeSubcategoryModal());
        cancelSubcategory.addEventListener('click', () => this.closeSubcategoryModal());
        saveSubcategory.addEventListener('click', () => this.saveSubcategory());
        subcategoryImage.addEventListener('change', (e) => this.handleSubcategoryImageSelection(e));

        // Upload modal events
        openBulkProductBtn.addEventListener('click', () => this.openMetadataModal());
        openBulkImageBtn.addEventListener('click', () => this.openUploadModal());
        closeUploadModal.addEventListener('click', () => this.closeUploadModal());
        cancelUpload.addEventListener('click', () => this.closeUploadModal());
        confirmUpload.addEventListener('click', () => this.uploadImages());

        // File input change
        fileInput.addEventListener('change', (e) => this.handleFileSelection(e));
        metadataFileInput.addEventListener('change', (e) => this.handleMetadataFileSelection(e));

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Metadata modal events
        closeMetadataModal.addEventListener('click', () => this.closeMetadataModal());
        cancelMetadataImport.addEventListener('click', () => this.closeMetadataModal());
        confirmMetadataImport.addEventListener('click', () => this.importMetadataFile());
        downloadTemplateBtn.addEventListener('click', () => this.downloadMetadataTemplate());
        downloadMetadataBtn.addEventListener('click', () => this.downloadExistingMetadata());
    }

    // Category Management
    openCategoryModal(categoryId = null) {
        const modal = document.getElementById('categoryModal');
        const modalTitle = document.getElementById('categoryModalTitle');
        
        if (categoryId) {
            modalTitle.textContent = 'Edit Collection';
            this.currentEditingCategory = categoryId;
            this.loadCategoryForEdit(categoryId);
        } else {
            modalTitle.textContent = 'Add Collection';
            this.currentEditingCategory = null;
            this.resetCategoryForm();
        }
        
        modal.classList.remove('hidden');
    }

    closeCategoryModal() {
        const modal = document.getElementById('categoryModal');
        modal.classList.add('hidden');
        this.resetCategoryForm();
        this.currentEditingCategory = null;
    }

    resetCategoryForm() {
        const categoryName = document.getElementById('categoryName');
        const categoryDescription = document.getElementById('categoryDescription');
        const categoryImage = document.getElementById('categoryImage');
        const uploadLabel = document.querySelector('.category-upload .upload-label span');

        categoryName.value = '';
        categoryDescription.value = '';
        categoryImage.value = '';
        uploadLabel.textContent = 'Choose cover image';
    }

    async loadCategoryForEdit(categoryId) {
        try {
            const categories = await window.dbManager.getCategories();
            const category = categories.find(c => c.id === categoryId);
            
            if (category) {
                document.getElementById('categoryName').value = category.name;
                document.getElementById('categoryDescription').value = category.description;
                
                const uploadLabel = document.querySelector('.category-upload .upload-label span');
                uploadLabel.textContent = 'Change cover image';
            }
        } catch (error) {
            console.error('Error loading category for edit:', error);
            this.showError('Failed to load collection details');
        }
    }

    handleCategoryImageSelection(event) {
        const files = event.target.files;
        const uploadLabel = document.querySelector('.category-upload .upload-label span');
        
        if (files.length > 0) {
            uploadLabel.textContent = `${files[0].name} selected`;
        } else {
            uploadLabel.textContent = this.currentEditingCategory ? 'Change cover image' : 'Choose cover image';
        }
    }

    async saveCategory() {
        const categoryName = document.getElementById('categoryName');
        const categoryDescription = document.getElementById('categoryDescription');
        const categoryImage = document.getElementById('categoryImage');
        const saveBtn = document.getElementById('saveCategory');

        const name = categoryName.value.trim();
        const description = categoryDescription.value.trim();

        if (!name) {
            this.showError('Please enter a collection name');
            return;
        }

        if (!description) {
            this.showError('Please enter a description');
            return;
        }

        // Disable save button and show loading
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            let imageData = null;
            
            // Handle image upload
            if (categoryImage.files.length > 0) {
                const file = categoryImage.files[0];
                if (!file.type.startsWith('image/')) {
                    this.showError('Please select a valid image file');
                    return;
                }
                imageData = await window.dbManager.fileToBase64(file);
            }

            const categoryData = {
                name,
                description,
                ...(imageData && { image: imageData })
            };

            if (this.currentEditingCategory) {
                // Update existing category
                categoryData.id = this.currentEditingCategory;
                await window.dbManager.addCategory(categoryData);
                this.showSuccess('Collection updated successfully');
            } else {
                // Create new category
                if (!imageData) {
                    this.showError('Please select a cover image');
                    return;
                }
                categoryData.id = Date.now().toString();
                categoryData.image = imageData;
                await window.dbManager.addCategory(categoryData);
                this.showSuccess('Collection created successfully');
            }

            this.closeCategoryModal();
            await window.gallery.refreshCategories();

        } catch (error) {
            console.error('Error saving category:', error);
            this.showError('Failed to save collection');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Collection';
        }
    }

    async editCategory(categoryId) {
        this.openCategoryModal(categoryId);
    }

    openSubcategoryModal() {
        if (!window.gallery.currentCategory) {
            this.showError('Select a category before adding sub-categories');
            return;
        }

        const modal = document.getElementById('subcategoryModal');
        const subcategoryName = document.getElementById('subcategoryName');
        const subcategoryDescription = document.getElementById('subcategoryDescription');
        const subcategoryImage = document.getElementById('subcategoryImage');
        const uploadLabel = document.querySelector('.subcategory-upload .upload-label span');
        subcategoryName.value = '';
        subcategoryDescription.value = '';
        subcategoryImage.value = '';
        uploadLabel.textContent = 'Choose sub-category cover image';
        modal.classList.remove('hidden');
    }

    closeSubcategoryModal() {
        const modal = document.getElementById('subcategoryModal');
        modal.classList.add('hidden');
    }

    handleSubcategoryImageSelection(event) {
        const files = event.target.files;
        const uploadLabel = document.querySelector('.subcategory-upload .upload-label span');

        if (files.length > 0) {
            uploadLabel.textContent = `${files[0].name} selected`;
        } else {
            uploadLabel.textContent = 'Choose sub-category cover image';
        }
    }

    async saveSubcategory() {
        const subcategoryNameInput = document.getElementById('subcategoryName');
        const subcategoryDescriptionInput = document.getElementById('subcategoryDescription');
        const subcategoryImageInput = document.getElementById('subcategoryImage');
        const saveBtn = document.getElementById('saveSubcategory');
        const name = subcategoryNameInput.value.trim();
        const description = subcategoryDescriptionInput.value.trim();

        if (!window.gallery.currentCategory) {
            this.showError('Select a category first');
            return;
        }

        if (!name) {
            this.showError('Please enter sub-category name');
            return;
        }

        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            let imageData = '';
            if (subcategoryImageInput.files.length > 0) {
                const file = subcategoryImageInput.files[0];
                if (!file.type.startsWith('image/')) {
                    this.showError('Please select a valid image file');
                    return;
                }
                imageData = await window.dbManager.fileToBase64(file);
            }

            if (!imageData) {
                this.showError('Please select a sub-category cover image');
                return;
            }

            await window.dbManager.addSubcategoryWithDetails(window.gallery.currentCategory, {
                name,
                description,
                image: imageData
            });
            this.showSuccess(`Sub-category "${name}" saved`);
            this.closeSubcategoryModal();
            await window.gallery.refreshGallery();
        } catch (error) {
            console.error('Error saving sub-category:', error);
            this.showError('Failed to save sub-category');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Sub-Category';
        }
    }

    // Image Upload Management
    openUploadModal() {
        if (!window.gallery.currentCategory) {
            this.showError('Please select a collection first');
            return;
        }
        
        const modal = document.getElementById('uploadModal');
        modal.classList.remove('hidden');
        this.resetUploadForm();
        this.populateUploadSubcategoryOptions();
    }

    closeUploadModal() {
        const modal = document.getElementById('uploadModal');
        modal.classList.add('hidden');
        this.resetUploadForm();
    }

    openMetadataModal() {
        const modal = document.getElementById('metadataModal');
        modal.classList.remove('hidden');
        this.resetMetadataForm();
    }

    closeMetadataModal() {
        const modal = document.getElementById('metadataModal');
        modal.classList.add('hidden');
        this.resetMetadataForm();
    }

    resetUploadForm() {
        const uploadModal = document.getElementById('uploadModal');
        const fileInput = document.getElementById('fileInput');
        const itemSubcategory = document.getElementById('itemSubcategory');
        const itemTagNumber = document.getElementById('itemTagNumber');
        const itemTitle = document.getElementById('itemTitle');
        const itemDescription = document.getElementById('itemDescription');
        const itemPrice = document.getElementById('itemPrice');
        const itemGoldType = document.getElementById('itemGoldType');
        const itemWeight = document.getElementById('itemWeight');
        const itemGst = document.getElementById('itemGst');
        const uploadLabel = uploadModal.querySelector('.upload-area .upload-label span');

        fileInput.value = '';
        itemSubcategory.innerHTML = '<option value="">No Sub-Category</option>';
        itemTagNumber.value = '';
        itemTitle.value = '';
        itemDescription.value = '';
        itemPrice.value = '';
        itemGoldType.value = '';
        itemWeight.value = '';
        itemGst.value = '';
        uploadLabel.textContent = 'Choose jewelry images or drag and drop';
    }

    populateUploadSubcategoryOptions() {
        const itemSubcategory = document.getElementById('itemSubcategory');
        const subcategories = window.gallery.currentSubcategories || [];
        const options = ['<option value="">No Sub-Category</option>'];
        for (const sub of subcategories) {
            options.push(`<option value="${sub.id}">${sub.name}</option>`);
        }
        itemSubcategory.innerHTML = options.join('');
    }

    resetMetadataForm() {
        const metadataFileInput = document.getElementById('metadataFileInput');
        const metadataFileLabel = document.getElementById('metadataFileLabel');
        metadataFileInput.value = '';
        metadataFileLabel.textContent = 'Choose Excel/CSV file';
    }

    handleFileSelection(event) {
        const files = event.target.files;
        this.updateFileCount(files.length);
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.style.borderColor = 'var(--primary)';
        event.currentTarget.style.background = 'var(--surface)';
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.style.borderColor = 'var(--border)';
        event.currentTarget.style.background = 'var(--surface-hover)';
        
        const files = event.dataTransfer.files;
        const fileInput = document.getElementById('fileInput');
        fileInput.files = files;
        this.updateFileCount(files.length);
    }

    updateFileCount(count) {
        const uploadModal = document.getElementById('uploadModal');
        const uploadLabel = uploadModal.querySelector('.upload-area .upload-label span');
        if (count > 0) {
            uploadLabel.textContent = `${count} image${count > 1 ? 's' : ''} selected`;
        } else {
            uploadLabel.textContent = 'Choose jewelry images or drag and drop';
        }
    }

    handleMetadataFileSelection(event) {
        const files = event.target.files;
        const metadataFileLabel = document.getElementById('metadataFileLabel');
        if (files.length > 0) {
            metadataFileLabel.textContent = `${files[0].name} selected`;
        } else {
            metadataFileLabel.textContent = 'Choose Excel/CSV file';
        }
    }

    parseCsvRow(line) {
        const row = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                const isEscapedQuote = inQuotes && line[i + 1] === '"';
                if (isEscapedQuote) {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                row.push(current.trim());
                current = '';
            } else {
                current += ch;
            }
        }

        row.push(current.trim());
        return row;
    }

    async parseMetadataFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        if (extension === 'csv') {
            const text = await file.text();
            const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
            if (lines.length === 0) return [];

            const headers = this.parseCsvRow(lines[0]).map((h) => h.trim());
            return lines.slice(1).map((line) => {
                const values = this.parseCsvRow(line);
                const row = {};
                headers.forEach((header, i) => {
                    row[header] = values[i] || '';
                });
                return row;
            });
        }

        if (extension === 'xlsx' || extension === 'xls') {
            if (!window.XLSX) {
                throw new Error('Excel parser not loaded. Please use CSV or keep internet enabled for XLSX support.');
            }

            const buffer = await file.arrayBuffer();
            const workbook = window.XLSX.read(buffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            return window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        }

        throw new Error('Unsupported file type. Use .xlsx, .xls, or .csv');
    }

    downloadCsvFile(fileName, headers, rows) {
        const escapeCsv = (value) => {
            const stringValue = String(value ?? '');
            return `"${stringValue.replace(/"/g, '""')}"`;
        };

        const lines = [
            headers.join(','),
            ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(','))
        ];

        const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    downloadMetadataTemplate() {
        const headers = ['tagNumber', 'title', 'description', 'price', 'goldType', 'weight', 'gst', 'category', 'subCategory'];
        const sampleRows = [
            {
                tagNumber: 'ABJ-1001',
                title: 'Gold Necklace',
                description: 'Temple design necklace',
                price: '125000',
                goldType: '22K',
                weight: '28.45 g',
                gst: '3%',
                category: 'gold-rings',
                subCategory: 'Bridal'
            },
            {
                tagNumber: 'ABJ-1002',
                title: 'Diamond Ring',
                description: 'Solitaire ring',
                price: '78500',
                goldType: '18K',
                weight: '6.20 g',
                gst: '3%',
                category: 'diamond-necklaces',
                subCategory: 'Daily Wear'
            }
        ];

        this.downloadCsvFile('product-metadata-template.csv', headers, sampleRows);
        this.showSuccess('Template downloaded');
    }

    async downloadExistingMetadata() {
        try {
            const rows = await window.dbManager.getAllProductMetadata();
            if (!rows.length) {
                this.showError('No metadata found yet. Import or add metadata first.');
                return;
            }

            const headers = ['tagNumber', 'title', 'description', 'price', 'goldType', 'weight', 'gst', 'category', 'subCategory'];
            this.downloadCsvFile('product-metadata-export.csv', headers, rows);
            this.showSuccess('Existing metadata downloaded');
        } catch (error) {
            console.error('Error downloading metadata:', error);
            this.showError('Failed to download metadata');
        }
    }

    normalizeTagNumber(tagNumber) {
        return window.dbManager.normalizeTagNumber(tagNumber);
    }

    extractTagFromFilename(fileName) {
        const baseName = fileName.replace(/\.[^/.]+$/, '');
        return this.normalizeTagNumber(baseName);
    }

    async importMetadataFile() {
        const metadataFileInput = document.getElementById('metadataFileInput');
        const confirmBtn = document.getElementById('confirmMetadataImport');
        const file = metadataFileInput.files[0];

        if (!file) {
            this.showError('Please select an Excel or CSV file');
            return;
        }

        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Importing...';

        try {
            const rows = await this.parseMetadataFile(file);
            if (!rows.length) {
                this.showError('No rows found in file');
                return;
            }

            const normalizedRows = rows.map((row) => ({
                tagNumber: row.tagNumber || row.TagNumber || row.tag_number || row.Tag || row.tag || '',
                title: row.title || row.Title || '',
                description: row.description || row.Description || '',
                price: row.price || row.Price || '',
                goldType: row.goldType || row.GoldType || row.gold_type || row.Gold || row.gold || '',
                weight: row.weight || row.Weight || '',
                gst: row.gst || row.GST || '',
                category: row.category || row.Category || '',
                subCategory: row.subCategory || row.subcategory || row.SubCategory || ''
            }));

            const { imported, skipped } = await window.dbManager.addOrUpdateProductMetadataBulk(normalizedRows);
            let createdOrUpdatedProducts = 0;
            const categories = await window.dbManager.getCategories();

            for (const row of normalizedRows) {
                const normalizedTag = this.normalizeTagNumber(row.tagNumber);
                if (!normalizedTag) {
                    continue;
                }

                let resolvedCategory = String(row.category || '').trim() || window.gallery.currentCategory;
                if (!resolvedCategory) {
                    continue;
                }

                const exactById = categories.find((category) => category.id === resolvedCategory);
                if (!exactById) {
                    const normalizedCategoryText = resolvedCategory.toLowerCase();
                    const categoryByName = categories.find((category) => String(category.name || '').toLowerCase() === normalizedCategoryText);
                    if (categoryByName) {
                        resolvedCategory = categoryByName.id;
                    }
                }

                const finalCategory = categories.find((category) => category.id === resolvedCategory);
                if (!finalCategory) {
                    continue;
                }

                const metadataSubCategoryName = String(row.subCategory || '').trim();
                let resolvedSubcategory = null;
                if (metadataSubCategoryName) {
                    resolvedSubcategory = await window.dbManager.ensureSubcategory(finalCategory.id, metadataSubCategoryName);
                }

                await window.dbManager.upsertProductRecordByTag(finalCategory.id, normalizedTag, {
                    title: String(row.title || '').trim() || normalizedTag,
                    description: String(row.description || '').trim(),
                    price: String(row.price || '').trim(),
                    goldType: String(row.goldType || '').trim(),
                    weight: String(row.weight || '').trim(),
                    gst: String(row.gst || '').trim(),
                    subcategoryId: resolvedSubcategory?.id || '',
                    subcategoryName: resolvedSubcategory?.name || ''
                });
                createdOrUpdatedProducts++;
            }

            this.showSuccess(`Metadata imported: ${imported}, skipped: ${skipped}. Grid rows ready: ${createdOrUpdatedProducts}. Upload images later with matching tag-number names.`);
            this.closeMetadataModal();
            await window.gallery.refreshGallery();
            await window.gallery.refreshCategories();
        } catch (error) {
            console.error('Error importing metadata:', error);
            this.showError(error.message || 'Failed to import metadata');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Import Metadata';
        }
    }

    async uploadImages() {
        const fileInput = document.getElementById('fileInput');
        const itemSubcategory = document.getElementById('itemSubcategory');
        const itemTagNumber = document.getElementById('itemTagNumber');
        const itemTitle = document.getElementById('itemTitle');
        const itemDescription = document.getElementById('itemDescription');
        const itemPrice = document.getElementById('itemPrice');
        const itemGoldType = document.getElementById('itemGoldType');
        const itemWeight = document.getElementById('itemWeight');
        const itemGst = document.getElementById('itemGst');
        const confirmBtn = document.getElementById('confirmUpload');

        const files = fileInput.files;
        const selectedSubcategoryId = itemSubcategory.value;
        const selectedSubcategory = (window.gallery.currentSubcategories || []).find((sub) => sub.id === selectedSubcategoryId) || null;
        const manualTagNumber = this.normalizeTagNumber(itemTagNumber.value.trim());
        const title = itemTitle.value.trim();
        const description = itemDescription.value.trim();
        const price = itemPrice.value.trim();
        const goldType = itemGoldType.value.trim();
        const weight = itemWeight.value.trim();
        const gst = itemGst.value.trim();

        if (files.length === 0) {
            this.showError('Please select at least one image');
            return;
        }

        // Disable upload button and show loading
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Uploading...';

        try {
            let uploadedCount = 0;
            const totalFiles = files.length;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                
                if (!file.type.startsWith('image/')) {
                    continue;
                }

                const imageData = await window.dbManager.fileToBase64(file);
                const thumbnail = await window.dbManager.createThumbnail(file);
                const thumbnailData = await window.dbManager.fileToBase64(thumbnail);
                const extractedTag = this.extractTagFromFilename(file.name);
                const effectiveTag = files.length === 1 ? (manualTagNumber || extractedTag) : extractedTag;
                const importedMetadata = effectiveTag ? await window.dbManager.getProductMetadata(effectiveTag) : null;

                const imageTitle = importedMetadata?.title || (files.length === 1 ? title : `${title || 'Item'} ${i + 1}`.trim()) || effectiveTag || file.name;
                const imageDescription = importedMetadata?.description || description;
                const imagePrice = importedMetadata?.price || price;
                const imageGoldType = importedMetadata?.goldType || goldType;
                const imageWeight = importedMetadata?.weight || weight;
                const imageGst = importedMetadata?.gst || gst;
                const metadataSubCategoryName = (importedMetadata?.subCategory || '').trim();
                let resolvedSubcategory = selectedSubcategory;
                if (!resolvedSubcategory && metadataSubCategoryName) {
                    resolvedSubcategory = await window.dbManager.ensureSubcategory(
                        window.gallery.currentCategory,
                        metadataSubCategoryName
                    );
                }

                const imageRecord = {
                    tagNumber: effectiveTag || '',
                    title: imageTitle,
                    description: imageDescription,
                    price: imagePrice,
                    goldType: imageGoldType,
                    weight: imageWeight,
                    gst: imageGst,
                    subcategoryId: resolvedSubcategory?.id || '',
                    subcategoryName: resolvedSubcategory?.name || '',
                    data: imageData,
                    thumbnail: thumbnailData,
                    hasImage: true,
                    category: window.gallery.currentCategory,
                    size: file.size,
                    type: file.type,
                    fileName: file.name
                };

                if (effectiveTag) {
                    await window.dbManager.upsertProductRecordByTag(window.gallery.currentCategory, effectiveTag, imageRecord);
                } else {
                    await window.dbManager.addImage(imageRecord);
                }
                uploadedCount++;

                // Update progress
                confirmBtn.textContent = `Uploading... ${uploadedCount}/${totalFiles}`;
            }

            this.showSuccess(`Successfully added ${uploadedCount} item${uploadedCount > 1 ? 's' : ''}`);
            this.closeUploadModal();
            
            // Refresh gallery and categories
            await window.gallery.refreshGallery();
            await window.gallery.refreshCategories();

        } catch (error) {
            console.error('Error uploading images:', error);
            this.showError('Failed to upload items');
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Add Items';
        }
    }

    async deleteImage(imageId) {
        try {
            await window.dbManager.deleteImage(imageId);
            this.showSuccess('Item deleted successfully');
            await window.gallery.refreshGallery();
            await window.gallery.refreshCategories();
        } catch (error) {
            console.error('Error deleting image:', error);
            this.showError('Failed to delete item');
        }
    }

    async updateImage(imageId, updateData) {
        try {
            await window.dbManager.updateImage(imageId, updateData);
            this.showSuccess('Item updated successfully');
            await window.gallery.refreshGallery();
        } catch (error) {
            console.error('Error updating image:', error);
            this.showError('Failed to update item');
        }
    }

    showError(message) {
        window.gallery.showError(message);
    }

    showSuccess(message) {
        window.gallery.showSuccess(message);
    }
}

// Initialize admin manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const userRole = localStorage.getItem('userRole');
    if (userRole === 'admin') {
        window.admin = new AdminManager();
    }
});
