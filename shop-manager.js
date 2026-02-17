class ShopManager {
    constructor() {
        this.storageKey = 'ayush_shop_settings';
        this.defaultSettings = {
            shopName: 'AYUSH ENTERPRISES',
            shopMobile: '8840960213',
            shopGSTIN: '09AWQPC5111N1ZX',
            shopAddress1: 'Amila (Polic Chauki)',
            shopAddress2: 'Mau (U.P.) - 275301',
            shopEmail: 'info@ayushenterprises.com',
            shopWatermark: 'AYUSH ENTERPRISES'
        };
        this.settings = this.loadSettings();
    }

    loadSettings() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                return { ...this.defaultSettings, ...JSON.parse(stored) };
            } catch (e) {
                console.error('Error parsing shop settings:', e);
                return this.defaultSettings;
            }
        }
        return this.defaultSettings;
    }

    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        this.updateGlobalUI();

        if (typeof showToast === 'function') {
            showToast('Shop settings saved successfully!', 'success');
        }
    }

    updateGlobalUI() {
        // This allows other scripts to access the latest settings
        window.shopSettings = this.settings;

        // Proactively update any visible branding elements if they exist
        const logoTexts = document.querySelectorAll('.sidebar-logo h2, h1, .svdt-watermark');
        logoTexts.forEach(el => {
            if (el.textContent === this.defaultSettings.shopName || el.textContent === 'AYUSH ENTERPRISES') {
                // Only update if it matches the default/old name to avoid overwriting unrelated headings
                // but since we want "his हिसाब से", we might want to be more specific or aggressive
            }
        });

        // We rely mostly on invoice generation consuming window.shopSettings
        if (typeof updateInvoice === 'function') {
            updateInvoice();
        }
    }

    async loadSettingsForm() {
        const container = document.getElementById('page-settings');
        if (!container) return;

        try {
            const response = await fetch('settings.html');
            if (!response.ok) throw new Error('Failed to load settings form');

            const html = await response.text();
            container.innerHTML = html;

            // Populate current values
            this.populateForm();

            // Setup live preview
            this.setupLivePreview();

            // Setup event listener
            const form = document.getElementById('shop-settings-form');
            if (form) {
                form.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleFormSubmit(form);
                });
            }
        } catch (error) {
            console.error('Error loading settings page:', error);
            container.innerHTML = `<div class="fetch-bill-empty"><h3>Error</h3><p>${error.message}</p></div>`;
        }
    }

    setupLivePreview() {
        const form = document.getElementById('shop-settings-form');
        if (!form) return;

        const inputs = form.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.updatePreviewFromForm(form);
            });
        });

        // Initial preview update
        this.updatePreviewFromForm(form);
    }

    updatePreviewFromForm(form) {
        const formData = new FormData(form);

        // Update preview elements
        const updateEl = (id, value, fallback = '') => {
            const el = document.getElementById(id);
            if (el) el.textContent = value || fallback;
        };

        updateEl('preview-shop-name', formData.get('shopName'), 'YOUR SHOP NAME');

        const addr1 = formData.get('shopAddress1') || '';
        const addr2 = formData.get('shopAddress2') || '';
        updateEl('preview-shop-address', addr1 + (addr1 && addr2 ? ', ' : '') + addr2, 'Shop Address Details');

        updateEl('preview-shop-gstin', formData.get('shopGSTIN'), 'Not Set');
        updateEl('preview-shop-mobile', formData.get('shopMobile'), 'Not Set');
        updateEl('preview-watermark', formData.get('shopWatermark'), 'WATERMARK');
    }

    populateForm() {
        const form = document.getElementById('shop-settings-form');
        if (!form) return;

        Object.keys(this.settings).forEach(key => {
            const input = form.elements[key];
            if (input) {
                input.value = this.settings[key];
            }
        });
    }

    handleFormSubmit(form) {
        const formData = new FormData(form);
        const newSettings = {};
        formData.forEach((value, key) => {
            newSettings[key] = value;
        });

        this.saveSettings(newSettings);

        // Add success animation to button
        const btn = form.querySelector('.premium-save-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i> Profile Updated!';
            btn.style.background = '#27ae60';

            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.style.background = '';
            }, 3000);
        }
    }
}

// Initialize the global manager
window.shopManager = new ShopManager();
window.shopSettings = window.shopManager.settings;
