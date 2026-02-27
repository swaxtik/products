// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
                
                // Listen for updates
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // New content is available, prompt user to refresh
                                if (confirm('New version available! Refresh to update?')) {
                                    window.location.reload();
                                }
                            }
                        });
                    }
                });
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Listen for service worker messages
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'SYNC_COMPLETE') {
            console.log('Background sync completed:', event.data.message);
            
            // Show a subtle notification to the user
            if (window.gallery && typeof window.gallery.showSuccess === 'function') {
                window.gallery.showSuccess('App updated in background');
            }
        }
    });
}

// Handle app installation prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    console.log('Install prompt available');
    e.preventDefault();
    deferredPrompt = e;
    
    // Show custom install button or banner
    showInstallPromotion();
});

function showInstallPromotion() {
    // Create install promotion banner
    const installBanner = document.createElement('div');
    installBanner.id = 'install-banner';
    installBanner.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: linear-gradient(135deg, #8B1538, #A91B47);
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(139, 21, 56, 0.3);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        animation: slideUp 0.3s ease;
    `;
    
    installBanner.innerHTML = `
        <div>
            <div style="font-weight: 600; margin-bottom: 4px;">Install Jewelry Gallery</div>
            <div style="font-size: 14px; opacity: 0.9;">Add to your home screen for quick access</div>
        </div>
        <div>
            <button id="install-btn" style="
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                margin-right: 8px;
            ">Install</button>
            <button id="dismiss-install" style="
                background: transparent;
                border: none;
                color: white;
                padding: 8px;
                border-radius: 8px;
                cursor: pointer;
                opacity: 0.7;
            ">✕</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    // Handle install button click
    document.getElementById('install-btn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Install prompt outcome:', outcome);
            deferredPrompt = null;
        }
        installBanner.remove();
    });
    
    // Handle dismiss button click
    document.getElementById('dismiss-install').addEventListener('click', () => {
        installBanner.remove();
        localStorage.setItem('install-dismissed', Date.now().toString());
    });
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
        if (document.getElementById('install-banner')) {
            installBanner.remove();
        }
    }, 10000);
}

// Handle successful app installation
window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed successfully');
    
    // Remove install banner if it exists
    const installBanner = document.getElementById('install-banner');
    if (installBanner) {
        installBanner.remove();
    }
    
    // Show success message
    if (window.gallery && typeof window.gallery.showSuccess === 'function') {
        window.gallery.showSuccess('App installed successfully!');
    }
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            transform: translateY(100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    #install-btn:hover {
        background: rgba(255, 255, 255, 0.3) !important;
    }
    
    #dismiss-install:hover {
        opacity: 1 !important;
    }
`;
document.head.appendChild(style);