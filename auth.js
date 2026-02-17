class AuthManager {
    constructor() {
        this.container = document.getElementById('auth-content');
        this.loading = document.getElementById('auth-loading');
        this.init();
    }

    init() {
        // Redirection if already logged in
        if (localStorage.getItem('isLoggedIn') === 'true') {
            window.location.href = 'index.html';
            return;
        }

        // Show expiry message if redirected
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('reason') === 'expired') {
            setTimeout(() => this.showToast('Session expired. Please login again.', 'error'), 100);
        }

        // Handle both initial load and AJAX-based initialization
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            this.loadForm('login');
        } else {
            window.addEventListener('load', () => this.loadForm('login'));
        }
    }

    logActivity(action, details = {}) {
        try {
            const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]');
            logs.push({
                action,
                details,
                timestamp: new Date().toISOString()
            });
            // Keep only last 50 logs
            if (logs.length > 50) logs.shift();
            localStorage.setItem('auth_logs', JSON.stringify(logs));
        } catch (e) {
            console.error('Error logging activity:', e);
        }
    }

    async loadForm(type) {
        let file = 'login.html';
        if (type === 'signup') file = 'signup.html';
        if (type === 'forgot') file = 'forgot-password.html';
        if (type === 'reset-password') file = 'reset-password.html';

        this.showLoading(true);

        try {
            // Simulate AJAX delay for premium feel
            await new Promise(resolve => setTimeout(resolve, 600));

            const response = await fetch(file);
            if (!response.ok) throw new Error('Failed to load ' + type);

            const html = await response.text();
            this.container.innerHTML = html;
            this.container.classList.remove('fade-in');
            void this.container.offsetWidth; // Trigger reflow
            this.container.classList.add('fade-in');

            // Pass email for reset-password form
            const emailForListener = (type === 'reset-password' && arguments.length > 1) ? arguments[1] : null;
            this.attachFormListener(type, emailForListener);

            // Pre-fill email if remembered
            if (type === 'login') {
                const rememberedEmail = localStorage.getItem('remembered_email');
                if (rememberedEmail) {
                    const emailInput = document.getElementById('email');
                    const rememberCheckbox = document.getElementById('remember');
                    if (emailInput) emailInput.value = rememberedEmail;
                    if (rememberCheckbox) rememberCheckbox.checked = true;
                }
            }
        } catch (error) {
            console.error(error);
            this.showToast('Error loading page. Please refresh.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    attachFormListener(type, email = null) {
        let formId = 'login-form';
        if (type === 'signup') formId = 'signup-form';
        else if (type === 'forgot') formId = 'forgot-form';
        else if (type === 'reset-password') formId = 'reset-form';

        const form = document.getElementById(formId);
        if (form) {
            if (email) form.setAttribute('data-email', email);
            form.addEventListener('submit', (e) => this.handleAuthSubmit(e, type));
        }
    }

    async hashPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    checkLockout(email) {
        const lockouts = JSON.parse(localStorage.getItem('auth_lockouts') || '{}');
        const lock = lockouts[email];
        if (lock && lock.until > Date.now()) {
            const minutes = Math.ceil((lock.until - Date.now()) / 60000);
            return `Account locked. Please try again in ${minutes} minute(s).`;
        }
        return null;
    }

    updateLockout(email, success) {
        const lockouts = JSON.parse(localStorage.getItem('auth_lockouts') || '{}');
        if (success) {
            delete lockouts[email];
        } else {
            const lock = lockouts[email] || { attempts: 0 };
            lock.attempts++;
            if (lock.attempts >= 5) {
                lock.until = Date.now() + 5 * 60000; // 5 minutes lock
            }
            lockouts[email] = lock;
        }
        localStorage.setItem('auth_lockouts', JSON.stringify(lockouts));
    }

    async handleAuthSubmit(e, type) {
        e.preventDefault();
        const btn = e.target.querySelector('button');
        if (!btn) return;
        const originalBtnText = btn.innerHTML;

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');
        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        // Validation
        if (type === 'signup' || type === 'reset-password') {
            const confirmInput = document.getElementById('confirm-password');
            const confirm = confirmInput ? confirmInput.value : '';
            if (password !== confirm) {
                this.showToast('Passwords do not match!', 'error');
                return;
            }
            if (password.length < 8) {
                this.showToast('Password must be at least 8 characters!', 'error');
                return;
            }
        }

        const lockoutMsg = this.checkLockout(email);
        if (lockoutMsg) {
            this.showToast(lockoutMsg, 'error');
            return;
        }

        // Show loading state on button
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        try {
            // Simulate AJAX delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            const users = JSON.parse(localStorage.getItem('registered_users') || '[]');
            const hashedPassword = password ? await this.hashPassword(password) : '';

            if (type === 'login') {
                const user = users.find(u => u.email === email);

                // For demo/testing: allow a default admin if no users exist
                const defaultAdminEmail = 'admin@ayush.com';
                const defaultAdminPassHash = await this.hashPassword('admin123');
                const isDefaultAdmin = users.length === 0 && email === defaultAdminEmail;

                if (user || isDefaultAdmin) {
                    const currentHashedPassword = user ? user.password : defaultAdminPassHash;

                    if (hashedPassword === currentHashedPassword) {
                        this.updateLockout(email, true);
                        const remember = document.getElementById('remember').checked;

                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('user_session', JSON.stringify({
                            email: email,
                            loggedInAt: new Date().toISOString(),
                            sessionExpiry: Date.now() + 3600000, // 1 hour
                            remember: remember
                        }));

                        if (remember) {
                            localStorage.setItem('remembered_email', email);
                        } else {
                            localStorage.removeItem('remembered_email');
                        }

                        this.logActivity('Login', { email });
                        this.showToast('Login successful! Welcome back.', 'success');

                        setTimeout(() => {
                            this.container.style.opacity = '0';
                            this.container.style.transform = 'translateY(-20px)';
                            this.container.style.transition = 'all 0.5s ease';
                            setTimeout(() => window.location.href = 'index.html', 500);
                        }, 1000);
                    } else {
                        this.updateLockout(email, false);
                        this.logActivity('Failed Login Attempt (Wrong Password)', { email });
                        this.showToast('Incorrect password! Please try again.', 'error');
                    }
                } else {
                    this.logActivity('Failed Login Attempt (User Not Found)', { email });
                    this.showToast('User does not exist! Please sign up.', 'error');
                }
            } else if (type === 'signup') {
                if (users.some(u => u.email === email)) {
                    this.showToast('Email already registered!', 'error');
                    return;
                }

                users.push({
                    email,
                    password: hashedPassword,
                    registeredAt: new Date().toISOString()
                });
                localStorage.setItem('registered_users', JSON.stringify(users));

                this.logActivity('Signup', { email });
                this.showToast('Account created successfully!', 'success');
                setTimeout(() => this.loadForm('login'), 1000);
            } else if (type === 'forgot') {
                const user = users.find(u => u.email === email);

                // Also check for default admin
                const defaultAdminEmail = 'admin@ayush.com';
                const isDefaultAdmin = users.length === 0 && email === defaultAdminEmail;

                if (user || isDefaultAdmin) {
                    const token = Math.random().toString(36).substr(2, 10).toUpperCase();
                    localStorage.setItem(`reset_${email}`, JSON.stringify({
                        token,
                        expiry: Date.now() + 15 * 60000 // 15 minutes
                    }));

                    this.logActivity('Password Reset Request', { email });

                    // Make it extremely visible for the demo
                    alert(`DEMO MODE: Password reset token is ${token}\n\nIn a real app, this would be sent to your email.`);

                    this.showToast(`Reset token: ${token}`, 'success');
                    console.log(`%c Reset Token for ${email}: ${token} `, 'background: #222; color: #bada55; font-size: 20px;');

                    setTimeout(() => this.loadForm('reset-password', email), 500);
                } else {
                    this.showToast('Email not found!', 'error');
                }
            } else if (type === 'reset-password') {
                const tokenInput = document.getElementById('token').value;
                const newPassword = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirm-password').value;
                const resetEmail = e.target.getAttribute('data-email');

                const storedReset = JSON.parse(localStorage.getItem(`reset_${resetEmail}`) || '{}');

                if (storedReset.token === tokenInput && storedReset.expiry > Date.now()) {
                    if (newPassword !== confirmPassword) {
                        this.showToast('Passwords do not match!', 'error');
                        return;
                    }

                    const userIndex = users.findIndex(u => u.email === resetEmail);
                    if (userIndex !== -1) {
                        users[userIndex].password = await this.hashPassword(newPassword);
                        localStorage.setItem('registered_users', JSON.stringify(users));
                        localStorage.removeItem(`reset_${resetEmail}`);
                        this.logActivity('Password Reset Success', { email: resetEmail });
                        this.showToast('Password reset successfully!', 'success');
                        setTimeout(() => this.loadForm('login'), 1500);
                    } else if (resetEmail === 'admin@ayush.com' && users.length === 0) {
                        // Handle default admin password reset by creating a new user entry
                        users.push({
                            email: resetEmail,
                            password: await this.hashPassword(newPassword),
                            registeredAt: new Date().toISOString()
                        });
                        localStorage.setItem('registered_users', JSON.stringify(users));
                        localStorage.removeItem(`reset_${resetEmail}`);
                        this.logActivity('Default Admin Password Set', { email: resetEmail });
                        this.showToast('Password set successfully!', 'success');
                        setTimeout(() => this.loadForm('login'), 1500);
                    }
                } else {
                    this.showToast('Invalid or expired token!', 'error');
                }
            }
        } catch (error) {
            console.error(error);
            this.showToast('Something went wrong. Try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalBtnText;
        }
    }

    showLoading(show) {
        this.loading.style.display = show ? 'flex' : 'none';
        this.container.style.display = show ? 'none' : 'block';
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('auth-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.className = 'auth-toast show' + (type === 'error' ? ' error' : '');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    togglePassword(id) {
        const input = document.getElementById(id);
        if (!input) return;
        const icon = input.nextElementSibling;
        if (input.type === 'password') {
            input.type = 'text';
            if (icon) icon.classList.replace('fa-eye-slash', 'fa-eye');
        } else {
            input.type = 'password';
            if (icon) icon.classList.replace('fa-eye', 'fa-eye-slash');
        }
    }

    checkStrength(password) {
        const bar = document.getElementById('strength-bar');
        const text = document.getElementById('strength-text');
        if (!bar || !text) return;

        let strength = 0;
        if (password.length >= 8) strength += 25;
        if (password.match(/[A-Z]/)) strength += 25;
        if (password.match(/[0-9]/)) strength += 25;
        if (password.match(/[^A-Za-z0-9]/)) strength += 25;

        bar.style.width = strength + '%';

        if (strength <= 25) {
            bar.style.backgroundColor = '#ef4444';
            text.textContent = 'Weak Password';
            text.style.color = '#ef4444';
        } else if (strength <= 50) {
            bar.style.backgroundColor = '#f59e0b';
            text.textContent = 'Medium Password';
            text.style.color = '#f59e0b';
        } else if (strength <= 75) {
            bar.style.backgroundColor = '#6366f1';
            text.textContent = 'Strong Password';
            text.style.color = '#6366f1';
        } else {
            bar.style.backgroundColor = '#10b981';
            text.textContent = 'Excellent Password';
            text.style.color = '#10b981';
        }
    }
}

const auth = new AuthManager();
window.auth = auth;
