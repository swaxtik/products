class DatabaseManager {
    constructor() {
        this.dbName = 'AbharanCatalogueDB';
        this.dbVersion = 4;
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
            };
        });
    }

    createStores(db) {
        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
            const categoriesStore = db.createObjectStore('categories', { keyPath: 'id' });
            categoriesStore.createIndex('name', 'name', { unique: true });
            categoriesStore.createIndex('timestamp', 'timestamp', { unique: false });
            
            // Add default categories after store is created
            categoriesStore.transaction.oncomplete = () => {
                this.addDefaultCategories();
            };
        }

        // Images store
        if (!db.objectStoreNames.contains('images')) {
            const imagesStore = db.createObjectStore('images', { keyPath: 'id' });
            imagesStore.createIndex('category', 'category', { unique: false });
            imagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Product metadata store keyed by tag number
        if (!db.objectStoreNames.contains('productMetadata')) {
            const metadataStore = db.createObjectStore('productMetadata', { keyPath: 'tagNumber' });
            metadataStore.createIndex('category', 'category', { unique: false });
            metadataStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Sub-categories per category
        if (!db.objectStoreNames.contains('subcategories')) {
            const subcategoriesStore = db.createObjectStore('subcategories', { keyPath: 'id' });
            subcategoriesStore.createIndex('categoryId', 'categoryId', { unique: false });
            subcategoriesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
    }

    async addDefaultCategories() {
        const defaultCategories = [
            {
                id: 'gold-rings',
                name: 'Gold Rings',
                description: 'Exquisite collection of gold rings featuring traditional and contemporary designs',
                image: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg?auto=compress&cs=tinysrgb&w=400',
                timestamp: Date.now() - 5000
            },
            {
                id: 'diamond-necklaces',
                name: 'Diamond Necklaces',
                description: 'Stunning diamond necklaces that add elegance to any occasion',
                image: 'https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg?auto=compress&cs=tinysrgb&w=400',
                timestamp: Date.now() - 4000
            },
            {
                id: 'pearl-jewelry',
                name: 'Pearl Jewelry',
                description: 'Classic pearl jewelry pieces that embody timeless sophistication',
                image: 'https://images.pexels.com/photos/1454172/pexels-photo-1454172.jpeg?auto=compress&cs=tinysrgb&w=400',
                timestamp: Date.now() - 3000
            },
            {
                id: 'silver-bracelets',
                name: 'Silver Bracelets',
                description: 'Handcrafted silver bracelets with intricate designs and patterns',
                image: 'https://images.pexels.com/photos/1454173/pexels-photo-1454173.jpeg?auto=compress&cs=tinysrgb&w=400',
                timestamp: Date.now() - 2000
            },
            {
                id: 'gemstone-earrings',
                name: 'Gemstone Earrings',
                description: 'Colorful gemstone earrings featuring precious and semi-precious stones',
                image: 'https://images.pexels.com/photos/1454174/pexels-photo-1454174.jpeg?auto=compress&cs=tinysrgb&w=400',
                timestamp: Date.now() - 1000
            }
        ];

        for (const category of defaultCategories) {
            try {
                await this.addCategory(category);
            } catch (error) {
                // Category might already exist, ignore error
                console.log('Category already exists:', category.name);
            }
        }
    }

    async addCategory(categoryData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categories'], 'readwrite');
            const store = transaction.objectStore('categories');
            
            const category = {
                id: categoryData.id || Date.now().toString(),
                ...categoryData,
                timestamp: categoryData.timestamp || Date.now()
            };

            const request = store.put(category);
            request.onsuccess = () => resolve(category);
            request.onerror = () => reject(request.error);
        });
    }

    async getCategories() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categories'], 'readonly');
            const store = transaction.objectStore('categories');
            
            const request = store.getAll();
            request.onsuccess = () => {
                const categories = request.result.sort((a, b) => a.timestamp - b.timestamp);
                resolve(categories);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteCategory(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['categories'], 'readwrite');
            const store = transaction.objectStore('categories');
            
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    normalizeSubcategoryName(name) {
        return String(name || '').trim().toLowerCase();
    }

    async addSubcategory(categoryId, name) {
        return new Promise((resolve, reject) => {
            const trimmedName = String(name || '').trim();
            if (!categoryId || !trimmedName) {
                reject(new Error('categoryId and subcategory name are required'));
                return;
            }

            const normalizedName = this.normalizeSubcategoryName(trimmedName);
            const id = `${categoryId}::${normalizedName}`;
            const transaction = this.db.transaction(['subcategories'], 'readwrite');
            const store = transaction.objectStore('subcategories');
            const record = {
                id,
                categoryId,
                name: trimmedName,
                description: '',
                image: '',
                normalizedName,
                timestamp: Date.now()
            };

            const request = store.put(record);
            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
        });
    }

    async addSubcategoryWithDetails(categoryId, subcategoryData) {
        return new Promise((resolve, reject) => {
            const trimmedName = String(subcategoryData?.name || '').trim();
            if (!categoryId || !trimmedName) {
                reject(new Error('categoryId and subcategory name are required'));
                return;
            }

            const normalizedName = this.normalizeSubcategoryName(trimmedName);
            const id = `${categoryId}::${normalizedName}`;
            const transaction = this.db.transaction(['subcategories'], 'readwrite');
            const store = transaction.objectStore('subcategories');
            const record = {
                id,
                categoryId,
                name: trimmedName,
                description: String(subcategoryData.description || '').trim(),
                image: subcategoryData.image || '',
                normalizedName,
                timestamp: Date.now()
            };

            const request = store.put(record);
            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
        });
    }

    async ensureSubcategory(categoryId, name) {
        return this.addSubcategory(categoryId, name);
    }

    async getSubcategories(categoryId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['subcategories'], 'readonly');
            const store = transaction.objectStore('subcategories');
            const index = store.index('categoryId');
            const request = index.getAll(categoryId);

            request.onsuccess = () => {
                const rows = request.result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                resolve(rows);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteSubcategoriesByCategory(categoryId) {
        const rows = await this.getSubcategories(categoryId);
        for (const row of rows) {
            await new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['subcategories'], 'readwrite');
                const store = transaction.objectStore('subcategories');
                const request = store.delete(row.id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        }
    }

    async addImage(imageData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            
            const image = {
                id: Date.now() + Math.random(),
                ...imageData,
                timestamp: Date.now()
            };

            const request = store.add(image);
            request.onsuccess = () => resolve(image);
            request.onerror = () => reject(request.error);
        });
    }

    async getImageByCategoryAndTag(categoryId, tagNumber) {
        const normalizedTag = this.normalizeTagNumber(tagNumber);
        if (!categoryId || !normalizedTag) {
            return null;
        }

        const images = await this.getImages(categoryId);
        return images.find((row) => this.normalizeTagNumber(row.tagNumber) === normalizedTag) || null;
    }

    async upsertProductRecordByTag(categoryId, tagNumber, productData = {}) {
        const normalizedTag = this.normalizeTagNumber(tagNumber);
        if (!categoryId || !normalizedTag) {
            throw new Error('category and tagNumber are required');
        }

        const existing = await this.getImageByCategoryAndTag(categoryId, normalizedTag);
        const now = Date.now();
        const payload = {
            tagNumber: normalizedTag,
            title: productData.title || '',
            description: productData.description || '',
            price: productData.price || '',
            goldType: productData.goldType || '',
            weight: productData.weight || '',
            gst: productData.gst || '',
            subcategoryId: productData.subcategoryId || '',
            subcategoryName: productData.subcategoryName || '',
            category: categoryId,
            hasImage: Boolean(productData.data || existing?.data),
            ...(productData.data ? { data: productData.data } : {}),
            ...(productData.thumbnail ? { thumbnail: productData.thumbnail } : {}),
            ...(productData.size ? { size: productData.size } : {}),
            ...(productData.type ? { type: productData.type } : {}),
            ...(productData.fileName ? { fileName: productData.fileName } : {}),
            updatedAt: now
        };

        if (existing) {
            const merged = {
                ...existing,
                ...payload,
                id: existing.id,
                timestamp: existing.timestamp || now
            };
            await this.updateImage(existing.id, merged);
            return merged;
        }

        return this.addImage({
            ...payload,
            timestamp: now
        });
    }

    async getImages(category = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            
            let request;
            if (category) {
                const index = store.index('category');
                request = index.getAll(category);
            } else {
                request = store.getAll();
            }

            request.onsuccess = () => {
                const images = request.result.sort((a, b) => b.timestamp - a.timestamp);
                resolve(images);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async updateImage(id, updateData) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            
            // First get the existing image
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const existingImage = getRequest.result;
                if (!existingImage) {
                    reject(new Error('Image not found'));
                    return;
                }
                
                // Update the image with new data
                const updatedImage = { ...existingImage, ...updateData };
                const putRequest = store.put(updatedImage);
                putRequest.onsuccess = () => resolve(updatedImage);
                putRequest.onerror = () => reject(putRequest.error);
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }

    async deleteImage(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readwrite');
            const store = transaction.objectStore('images');
            
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getCategoryImageCount(categoryId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['images'], 'readonly');
            const store = transaction.objectStore('images');
            const index = store.index('category');
            
            const request = index.count(categoryId);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    normalizeTagNumber(tagNumber) {
        if (!tagNumber) return '';
        return String(tagNumber).trim().toUpperCase();
    }

    async addOrUpdateProductMetadata(metadata) {
        return new Promise((resolve, reject) => {
            const normalizedTag = this.normalizeTagNumber(metadata.tagNumber);
            if (!normalizedTag) {
                reject(new Error('tagNumber is required'));
                return;
            }

            const transaction = this.db.transaction(['productMetadata'], 'readwrite');
            const store = transaction.objectStore('productMetadata');

            const record = {
                tagNumber: normalizedTag,
                title: metadata.title || '',
                description: metadata.description || '',
                price: metadata.price || '',
                goldType: metadata.goldType || '',
                weight: metadata.weight || '',
                gst: metadata.gst || '',
                category: metadata.category || '',
                subCategory: metadata.subCategory || '',
                timestamp: Date.now()
            };

            const request = store.put(record);
            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
        });
    }

    async addOrUpdateProductMetadataBulk(rows) {
        const results = {
            imported: 0,
            skipped: 0
        };

        for (const row of rows) {
            const tagNumber = this.normalizeTagNumber(row.tagNumber);
            if (!tagNumber) {
                results.skipped++;
                continue;
            }

            await this.addOrUpdateProductMetadata({
                tagNumber,
                title: row.title || row.itemTitle || '',
                description: row.description || row.itemDescription || '',
                price: row.price || '',
                goldType: row.goldType || row.gold || '',
                weight: row.weight || '',
                gst: row.gst || '',
                category: row.category || '',
                subCategory: row.subCategory || row.subcategory || ''
            });
            results.imported++;
        }

        return results;
    }

    async getProductMetadata(tagNumber) {
        return new Promise((resolve, reject) => {
            const normalizedTag = this.normalizeTagNumber(tagNumber);
            if (!normalizedTag) {
                resolve(null);
                return;
            }

            const transaction = this.db.transaction(['productMetadata'], 'readonly');
            const store = transaction.objectStore('productMetadata');
            const request = store.get(normalizedTag);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllProductMetadata() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['productMetadata'], 'readonly');
            const store = transaction.objectStore('productMetadata');
            const request = store.getAll();

            request.onsuccess = () => {
                const rows = request.result.sort((a, b) => (a.tagNumber || '').localeCompare(b.tagNumber || ''));
                resolve(rows);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Utility method to convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Utility method to create thumbnail
    async createThumbnail(file, maxWidth = 400, maxHeight = 400) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                const { width, height } = img;
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                
                canvas.width = width * ratio;
                canvas.height = height * ratio;
                
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob(resolve, 'image/jpeg', 0.9);
            };
            
            img.src = URL.createObjectURL(file);
        });
    }
}

// Global database instance
window.dbManager = new DatabaseManager();

// Load all categories and subcategories
function getAllCategoriesWithSubs() {
    return JSON.parse(localStorage.getItem('categories') || '{}');
}
