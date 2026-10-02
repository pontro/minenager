// --- Account & License Management ---
import { showToast } from './utils.js';

export function initAccountManager() {
    const modalAccount = document.getElementById('modalAccount');
    const btnOpenAccountModal = document.getElementById('btnOpenAccountModal');
    const btnCloseAccountModal = document.getElementById('btnCloseAccountModal');
    const formAccountLogin = document.getElementById('formAccountLogin');
    const accountEmailInput = document.getElementById('accountEmailInput');
    const btnAccountSignIn = document.getElementById('btnAccountSignIn');
    const btnAccountLogout = document.getElementById('btnAccountLogout');
    const triggerButtons = document.querySelectorAll('.btnTriggerAccountModal');

    // View sections
    const accountAuthSection = document.getElementById('accountAuthSection');
    const accountProfileSection = document.getElementById('accountProfileSection');
    const accountBadgePro = document.getElementById('accountBadgePro');
    const accountBadgeFree = document.getElementById('accountBadgeFree');
    const accountProfileEmail = document.getElementById('accountProfileEmail');
    const accountProfileDomain = document.getElementById('accountProfileDomain');
    const sidebarAccountLabel = document.getElementById('sidebarAccountLabel');
    const sidebarTierBadge = document.getElementById('sidebarTierBadge');
    const discordProBanner = document.getElementById('discordProBanner');
    const btnSaveDiscord = document.getElementById('btnSaveDiscord');
    const btnTestDiscord = document.getElementById('btnTestDiscord');

    function openModal() {
        if (!modalAccount) return;
        modalAccount.classList.add('active');
        modalAccount.style.display = 'flex';
        fetchAccountStatus();
    }

    function closeModal() {
        if (!modalAccount) return;
        modalAccount.classList.remove('active');
        modalAccount.style.display = 'none';
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

    const discordProOverlay = document.getElementById('discordProOverlay');

    function updateAccountUI(data) {
        const isPro = data.is_pro || (data.tier === 'pro');
        const loggedIn = data.logged_in;

        if (loggedIn) {
            if (accountAuthSection) accountAuthSection.style.display = 'none';
            if (accountProfileSection) accountProfileSection.style.display = 'flex';
            if (accountProfileEmail) accountProfileEmail.textContent = data.email || 'Pro User';
            if (accountProfileDomain) accountProfileDomain.textContent = `${data.subdomain || 'myserver'}.minenager.net`;
            if (sidebarAccountLabel) sidebarAccountLabel.textContent = 'Account';
        } else {
            if (accountAuthSection) accountAuthSection.style.display = 'flex';
            if (accountProfileSection) accountProfileSection.style.display = 'none';
            if (sidebarAccountLabel) sidebarAccountLabel.textContent = 'Login';
        }

        // Badges & Pro Overlay
        if (isPro) {
            if (accountBadgePro) accountBadgePro.style.display = 'inline-block';
            if (accountBadgeFree) accountBadgeFree.style.display = 'none';
            if (sidebarTierBadge) {
                sidebarTierBadge.textContent = 'PRO';
                sidebarTierBadge.style.background = '#3b2a05';
                sidebarTierBadge.style.color = '#fbbf24';
                sidebarTierBadge.style.borderColor = '#d97706';
            }
            if (discordProOverlay) discordProOverlay.classList.remove('active');
            if (btnSaveDiscord) btnSaveDiscord.disabled = false;
            if (btnTestDiscord) btnTestDiscord.disabled = false;
        } else {
            if (accountBadgePro) accountBadgePro.style.display = 'none';
            if (accountBadgeFree) accountBadgeFree.style.display = 'inline-block';
            if (sidebarTierBadge) {
                sidebarTierBadge.textContent = 'FREE';
                sidebarTierBadge.style.background = '#27272a';
                sidebarTierBadge.style.color = 'var(--text-secondary)';
                sidebarTierBadge.style.borderColor = '#3f3f46';
            }
            if (discordProOverlay) discordProOverlay.classList.add('active');
            if (btnSaveDiscord) btnSaveDiscord.disabled = true;
            if (btnTestDiscord) btnTestDiscord.disabled = true;
        }
    }

    btnAccountSignIn?.addEventListener('click', async () => {
        const email = accountEmailInput?.value?.trim();
        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address.');
            return;
        }

        btnAccountSignIn.disabled = true;
        btnAccountSignIn.textContent = 'Activating...';

        try {
            const res = await fetch('/api/account/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email, tier: 'pro' })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Sign in failed');

            showToast('Minenager Pro activated successfully!');
            updateAccountUI(data);
            setTimeout(closeModal, 600);
        } catch (err) {
            alert(`Login error: ${err.message}`);
        } finally {
            btnAccountSignIn.disabled = false;
            btnAccountSignIn.textContent = 'Sign In / Activate Pro';
        }
    });

    btnAccountLogout?.addEventListener('click', async () => {
        try {
            const res = await fetch('/api/account/logout', { method: 'POST' });
            const data = await res.json();
            showToast('Signed out of Minenager.');
            updateAccountUI(data);
        } catch (err) {
            alert(`Logout error: ${err.message}`);
        }
    });

    // Initial check
    fetchAccountStatus();

    return { fetchAccountStatus, openModal };
}
