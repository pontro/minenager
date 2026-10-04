// --- Account & License Management ---
import { showToast } from './utils.js';

export function initAccountManager() {
    const modalAccount = document.getElementById('modalAccount');
    const btnOpenAccountModal = document.getElementById('btnOpenAccountModal');
    const btnCloseAccountModal = document.getElementById('btnCloseAccountModal');
    const triggerButtons = document.querySelectorAll('.btnTriggerAccountModal');

    // Sections
    const accountAuthSection = document.getElementById('accountAuthSection');
    const accountProfileSection = document.getElementById('accountProfileSection');

    // Badges in Modal Header
    const accountBadgeGuest = document.getElementById('accountBadgeGuest');
    const accountBadgeFree = document.getElementById('accountBadgeFree');
    const accountBadgePro = document.getElementById('accountBadgePro');

    // Alert
    const authAlertError = document.getElementById('authAlertError');
    const authAlertErrorText = document.getElementById('authAlertErrorText');

    // Tab buttons & forms
    const tabBtnSignIn = document.getElementById('tabBtnSignIn');
    const tabBtnSignUp = document.getElementById('tabBtnSignUp');
    const formSignIn = document.getElementById('formSignIn');
    const formSignUp = document.getElementById('formSignUp');
    const linkSwitchToSignUp = document.getElementById('linkSwitchToSignUp');
    const linkSwitchToSignIn = document.getElementById('linkSwitchToSignIn');

    // Sign In inputs
    const loginIdentifierInput = document.getElementById('loginIdentifierInput');
    const loginPasswordInput = document.getElementById('loginPasswordInput');
    const btnSignInSubmit = document.getElementById('btnSignInSubmit');

    // Sign Up inputs
    const regUsernameInput = document.getElementById('regUsernameInput');
    const regEmailInput = document.getElementById('regEmailInput');
    const regPasswordInput = document.getElementById('regPasswordInput');
    const btnSignUpSubmit = document.getElementById('btnSignUpSubmit');

    // Profile elements
    const profileAvatar = document.getElementById('profileAvatar');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const profileTierTag = document.getElementById('profileTierTag');
    const proLicenseCard = document.getElementById('proLicenseCard');
    const proActiveCard = document.getElementById('proActiveCard');
    const licenseKeyInput = document.getElementById('licenseKeyInput');
    const btnActivateLicense = document.getElementById('btnActivateLicense');
    const btnAccountLogout = document.getElementById('btnAccountLogout');

    // Sidebar elements
    const sidebarAccountLabel = document.getElementById('sidebarAccountLabel');
    const sidebarTierBadge = document.getElementById('sidebarTierBadge');

    // Discord Lock Overlay
    const discordProOverlay = document.getElementById('discordProOverlay');
    const btnSaveDiscord = document.getElementById('btnSaveDiscord');
    const btnTestDiscord = document.getElementById('btnTestDiscord');

    function showError(msg) {
        if (!authAlertError || !authAlertErrorText) return;
        authAlertErrorText.textContent = msg;
        authAlertError.style.display = 'flex';
    }

    function clearError() {
        if (authAlertError) authAlertError.style.display = 'none';
    }

    function setTab(mode) {
        clearError();
        if (mode === 'signup') {
            tabBtnSignIn?.classList.remove('active');
            tabBtnSignUp?.classList.add('active');
            if (formSignIn) formSignIn.style.display = 'none';
            if (formSignUp) formSignUp.style.display = 'flex';
            regUsernameInput?.focus();
        } else {
            tabBtnSignUp?.classList.remove('active');
            tabBtnSignIn?.classList.add('active');
            if (formSignUp) formSignUp.style.display = 'none';
            if (formSignIn) formSignIn.style.display = 'flex';
            loginIdentifierInput?.focus();
        }
    }

    tabBtnSignIn?.addEventListener('click', () => setTab('signin'));
    tabBtnSignUp?.addEventListener('click', () => setTab('signup'));
    linkSwitchToSignUp?.addEventListener('click', () => setTab('signup'));
    linkSwitchToSignIn?.addEventListener('click', () => setTab('signin'));

    // Password visibility toggles
    document.querySelectorAll('.btn-toggle-pw').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = btn.getAttribute('data-target');
            const targetInput = document.getElementById(targetId);
            if (!targetInput) return;
            const isPassword = targetInput.type === 'password';
            targetInput.type = isPassword ? 'text' : 'password';
            btn.style.color = isPassword ? '#38bdf8' : 'var(--text-muted)';
        });
    });

    function openModal() {
        if (!modalAccount) return;
        clearError();
        if (loginPasswordInput) loginPasswordInput.value = '';
        if (regPasswordInput) regPasswordInput.value = '';
        modalAccount.classList.add('active');
        modalAccount.style.display = 'flex';
        fetchAccountStatus();
    }

    function closeModal() {
        if (!modalAccount) return;
        modalAccount.classList.remove('active');
        modalAccount.style.display = 'none';
        clearError();
        if (loginPasswordInput) loginPasswordInput.value = '';
        if (regPasswordInput) regPasswordInput.value = '';
    }

    btnOpenAccountModal?.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });
    btnCloseAccountModal?.addEventListener('click', (e) => {
        e.preventDefault();
        closeModal();
    });
    triggerButtons.forEach(btn => btn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    }));

    modalAccount?.addEventListener('click', (e) => {
        if (e.target === modalAccount) closeModal();
    });

    async function fetchAccountStatus() {
        try {
            const res = await fetch('/api/account/status');
            const data = await res.json();
            updateAccountUI(data);
        } catch (err) {
            console.error('Error fetching account status:', err);
        }
    }

    function updateAccountUI(data) {
        const loggedIn = Boolean(data.logged_in);
        const isPro = Boolean(data.is_pro || (data.tier === 'pro'));
        const username = data.username || (data.email ? data.email.split('@')[0] : 'User');
        const email = data.email || '';

        // Modal View Toggle
        if (loggedIn) {
            if (accountAuthSection) accountAuthSection.style.display = 'none';
            if (accountProfileSection) accountProfileSection.style.display = 'flex';

            // User Info
            if (profileUsername) profileUsername.textContent = username;
            if (profileEmail) profileEmail.textContent = email;
            if (profileAvatar) {
                profileAvatar.textContent = username.slice(0, 2).toUpperCase();
            }

            // Modal Header Badges
            if (accountBadgeGuest) accountBadgeGuest.style.display = 'none';
            if (isPro) {
                if (accountBadgePro) accountBadgePro.style.display = 'inline-block';
                if (accountBadgeFree) accountBadgeFree.style.display = 'none';
                if (profileTierTag) {
                    profileTierTag.textContent = 'PRO';
                    profileTierTag.className = 'version-pill badge-pro';
                }
                if (proLicenseCard) proLicenseCard.style.display = 'none';
                if (proActiveCard) proActiveCard.style.display = 'flex';
            } else {
                if (accountBadgePro) accountBadgePro.style.display = 'none';
                if (accountBadgeFree) accountBadgeFree.style.display = 'inline-block';
                if (profileTierTag) {
                    profileTierTag.textContent = 'FREE';
                    profileTierTag.className = 'version-pill badge-free';
                }
                if (proLicenseCard) proLicenseCard.style.display = 'flex';
                if (proActiveCard) proActiveCard.style.display = 'none';
            }

            // Sidebar
            if (sidebarAccountLabel) sidebarAccountLabel.textContent = username;
            if (sidebarTierBadge) {
                sidebarTierBadge.textContent = isPro ? 'PRO' : 'FREE';
                sidebarTierBadge.className = `version-pill ${isPro ? 'badge-pro' : 'badge-free'}`;
            }
        } else {
            if (accountAuthSection) accountAuthSection.style.display = 'flex';
            if (accountProfileSection) accountProfileSection.style.display = 'none';

            // Modal Header Badges
            if (accountBadgeGuest) accountBadgeGuest.style.display = 'inline-block';
            if (accountBadgeFree) accountBadgeFree.style.display = 'none';
            if (accountBadgePro) accountBadgePro.style.display = 'none';

            // Sidebar
            if (sidebarAccountLabel) sidebarAccountLabel.textContent = 'Login';
            if (sidebarTierBadge) {
                sidebarTierBadge.textContent = 'GUEST';
                sidebarTierBadge.className = 'version-pill badge-guest';
            }
        }

        // Discord Feature Lock Status
        if (isPro) {
            if (discordProOverlay) discordProOverlay.classList.remove('active');
            if (btnSaveDiscord) btnSaveDiscord.disabled = false;
            if (btnTestDiscord) btnTestDiscord.disabled = false;
        } else {
            if (discordProOverlay) discordProOverlay.classList.add('active');
            if (btnSaveDiscord) btnSaveDiscord.disabled = true;
            if (btnTestDiscord) btnTestDiscord.disabled = true;
        }
    }

    // Sign In Submission
    formSignIn?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const identifier = loginIdentifierInput?.value?.trim();
        const password = loginPasswordInput?.value;

        if (!identifier || !password) {
            showError('Please enter your username/email and password.');
            return;
        }

        btnSignInSubmit.disabled = true;
        const originalText = btnSignInSubmit.textContent;
        btnSignInSubmit.textContent = 'Signing in...';

        try {
            const res = await fetch('/api/account/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username_or_email: identifier, password: password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Sign in failed.');

            showToast(`Welcome back, ${data.username || 'user'}!`);
            loginPasswordInput.value = '';
            updateAccountUI(data);
            setTimeout(closeModal, 400);
        } catch (err) {
            showError(err.message);
        } finally {
            btnSignInSubmit.disabled = false;
            btnSignInSubmit.textContent = originalText;
        }
    });

    // Sign Up Submission
    formSignUp?.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();

        const username = regUsernameInput?.value?.trim();
        const email = regEmailInput?.value?.trim();
        const password = regPasswordInput?.value;

        if (!username || !email || !password) {
            showError('Please fill out all fields.');
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters.');
            return;
        }

        btnSignUpSubmit.disabled = true;
        const originalText = btnSignUpSubmit.textContent;
        btnSignUpSubmit.textContent = 'Creating account...';

        try {
            const res = await fetch('/api/account/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Registration failed.');

            showToast('Account created successfully!');
            regPasswordInput.value = '';
            updateAccountUI(data);
            setTimeout(closeModal, 400);
        } catch (err) {
            showError(err.message);
        } finally {
            btnSignUpSubmit.disabled = false;
            btnSignUpSubmit.textContent = originalText;
        }
    });

    // License Activation
    btnActivateLicense?.addEventListener('click', async () => {
        const key = licenseKeyInput?.value?.trim();
        if (!key) {
            alert('Please enter a license key.');
            return;
        }

        btnActivateLicense.disabled = true;
        btnActivateLicense.textContent = 'Activating...';

        try {
            const res = await fetch('/api/account/license/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ license_key: key })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to activate license.');

            showToast('Minenager Pro activated successfully!');
            if (licenseKeyInput) licenseKeyInput.value = '';
            updateAccountUI(data);
        } catch (err) {
            alert(`Activation error: ${err.message}`);
        } finally {
            btnActivateLicense.disabled = false;
            btnActivateLicense.textContent = 'Activate';
        }
    });

    // Sign Out
    btnAccountLogout?.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/account/logout', { method: 'POST' });
            const data = await res.json();
            showToast('Signed out of Minenager.');
            updateAccountUI(data);
            setTab('signin');
        } catch (err) {
            alert(`Logout error: ${err.message}`);
        }
    });

    // Initial check
    fetchAccountStatus();

    return { fetchAccountStatus, openModal };
}

