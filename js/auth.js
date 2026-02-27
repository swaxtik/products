class AuthManager {
    constructor() {
        this.ADMIN_PASSWORD = 'Swasthik@Abj';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        const adminBtn = document.getElementById('adminBtn');
        const userBtn = document.getElementById('userBtn');
        const adminLoginBtn = document.getElementById('adminLoginBtn');
        const userLoginBtn = document.getElementById('userLoginBtn');
        const adminPassword = document.getElementById('adminPassword');

        adminBtn.addEventListener('click', () => this.switchRole('admin'));
        userBtn.addEventListener('click', () => this.switchRole('user'));
        adminLoginBtn.addEventListener('click', () => this.loginAsAdmin());
        userLoginBtn.addEventListener('click', () => this.loginAsUser());

        adminPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loginAsAdmin();
            }
        });
    }

    switchRole(role) {
        const adminBtn = document.getElementById('adminBtn');
        const userBtn = document.getElementById('userBtn');
        const adminLogin = document.getElementById('adminLogin');
        const userLogin = document.getElementById('userLogin');

        if (role === 'admin') {
            adminBtn.classList.add('active');
            userBtn.classList.remove('active');
            adminLogin.classList.remove('hidden');
            userLogin.classList.add('hidden');
        } else {
            userBtn.classList.add('active');
            adminBtn.classList.remove('active');
            userLogin.classList.remove('hidden');
            adminLogin.classList.add('hidden');
        }
    }

    loginAsAdmin() {
        const passwordInput = document.getElementById('adminPassword');
        const password = passwordInput.value;

        if (password === this.ADMIN_PASSWORD) {
            this.setAuthStatus('admin');
            this.redirectToGallery();
        } else {
            this.showError('Invalid password');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    loginAsUser() {
        this.setAuthStatus('user');
        this.redirectToGallery();
    }

    setAuthStatus(role) {
        localStorage.setItem('userRole', role);
        localStorage.setItem('authTimestamp', Date.now().toString());
    }

    checkAuthStatus() {
        const userRole = localStorage.getItem('userRole');
        const authTimestamp = localStorage.getItem('authTimestamp');

        if (userRole && authTimestamp) {
            // Check if auth is still valid (24 hours)
            const now = Date.now();
            const authTime = parseInt(authTimestamp);
            const isValid = (now - authTime) < 24 * 60 * 60 * 1000;

            if (isValid) {
                this.redirectToGallery();
            } else {
                this.logout();
            }
        }
    }

    redirectToGallery() {
        window.location.href = 'gallery.html';
    }

    logout() {
        localStorage.removeItem('userRole');
        localStorage.removeItem('authTimestamp');
        window.location.href = 'index.html';
    }

    showError(message) {
        // Create and show error message
        const existingError = document.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #FEE2E2;
            border: 1px solid #FECACA;
            color: #DC2626;
            padding: 12px;
            border-radius: 12px;
            margin-top: 16px;
            font-size: 14px;
            text-align: center;
            animation: fadeIn 0.3s ease;
        `;
        errorDiv.textContent = message;

        const loginForm = document.querySelector('.login-form:not(.hidden)');
        loginForm.appendChild(errorDiv);

        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }
}

// Initialize auth manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});