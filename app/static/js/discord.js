// --- Discord Bot Management & Remote Control ---
import { showToast } from './utils.js';

export function initDiscordManager() {
    const discordForm = document.getElementById('discordForm');
    const discordToken = document.getElementById('discord_token');
    const btnToggleTokenVisibility = document.getElementById('btnToggleTokenVisibility');
    const btnTestDiscord = document.getElementById('btnTestDiscord');
    const btnSaveDiscord = document.getElementById('btnSaveDiscord');
    const discordStatusBadge = document.getElementById('discordStatusBadge');

    // Toggle token password mask
    btnToggleTokenVisibility?.addEventListener('click', () => {
        if (!discordToken) return;
        if (discordToken.type === 'password') {
            discordToken.type = 'text';
            btnToggleTokenVisibility.textContent = '🔒';
        } else {
            discordToken.type = 'password';
            btnToggleTokenVisibility.textContent = '👁️';
        }
    });

    // Save Discord Settings Function
    async function saveDiscordSettings(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        if (btnSaveDiscord) {
            btnSaveDiscord.disabled = true;
            btnSaveDiscord.textContent = '⏳ Saving...';
        }

        const enabled = document.getElementById('discord_enabled')?.checked || false;
        const token = discordToken?.value.trim() || '';
        const channel_id = document.getElementById('discord_channel_id')?.value.trim() || '';
        const prefix = document.getElementById('discord_prefix')?.value.trim() || '!';
        const allow_public_status = document.getElementById('discord_allow_public_status')?.checked || false;

        const adminIdsRaw = document.getElementById('discord_admin_ids')?.value || '';
        const admin_ids = adminIdsRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

        const adminRolesRaw = document.getElementById('discord_admin_role_ids')?.value || '';
        const admin_role_ids = adminRolesRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);

        const notify_server_start = document.getElementById('discord_notify_server_start')?.checked || false;
        const notify_server_stop = document.getElementById('discord_notify_server_stop')?.checked || false;
        const notify_player_join_leave = document.getElementById('discord_notify_player_join_leave')?.checked || false;
        const notify_server_crash = document.getElementById('discord_notify_server_crash')?.checked || false;

        try {
            const res = await fetch('/api/discord', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled,
                    token,
                    channel_id,
                    prefix,
                    allow_public_status,
                    admin_ids,
                    admin_role_ids,
                    notify_server_start,
                    notify_server_stop,
                    notify_player_join_leave,
                    notify_server_crash
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to save Discord settings');

            showToast('✔ Discord Bot settings saved!');

            if (discordToken && token) {
                discordToken.value = '';
                discordToken.placeholder = '•••••••••••••••••••••••• (Saved)';
            }
            const tokenSavedBadge = document.getElementById('tokenSavedBadge');
            if (tokenSavedBadge) {
                tokenSavedBadge.style.display = 'inline-block';
            }

            await loadDiscordStatus();
        } catch (err) {
            console.error('Error saving Discord settings:', err);
            alert(`Error saving Discord settings: ${err.message}`);
        } finally {
            if (btnSaveDiscord) {
                btnSaveDiscord.disabled = false;
                btnSaveDiscord.textContent = '💾 Save Discord Settings';
            }
        }
    }

    discordForm?.addEventListener('submit', saveDiscordSettings);
    btnSaveDiscord?.addEventListener('click', saveDiscordSettings);

    // Send Test Message
    btnTestDiscord?.addEventListener('click', async () => {
        btnTestDiscord.disabled = true;
        btnTestDiscord.textContent = '⏳ Sending...';

        try {
            const res = await fetch('/api/discord/test', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Test notification failed');

            showToast(`✔ ${data.message || 'Test message sent to Discord!'}`);
        } catch (err) {
            alert(`Discord Test Error:\n\n${err.message}`);
        } finally {
            btnTestDiscord.disabled = false;
            btnTestDiscord.textContent = '🧪 Send Test Message';
            loadDiscordStatus();
        }
    });

    // Status Polling & Refresh
    async function loadDiscordStatus() {
        if (!discordStatusBadge) return;
        try {
            const res = await fetch('/api/discord');
            const data = await res.json();
            const status = data.status || {};
            const cfg = data.config || {};

            // Update badge
            if (!cfg.enabled) {
                discordStatusBadge.className = 'status-badge offline';
                discordStatusBadge.textContent = '○ Disabled';
            } else if (status.status === 'connected') {
                discordStatusBadge.className = 'status-badge online';
                const botName = status.bot_user ? status.bot_user.username : 'Bot';
                discordStatusBadge.textContent = `● Connected as ${botName}`;
            } else if (status.status === 'connecting') {
                discordStatusBadge.className = 'status-badge starting';
                discordStatusBadge.textContent = '◐ Connecting...';
            } else if (status.status === 'error') {
                discordStatusBadge.className = 'status-badge offline';
                discordStatusBadge.textContent = `⚠️ Error: ${status.last_error ? status.last_error.slice(0, 25) : 'Disconnected'}`;
            } else {
                discordStatusBadge.className = 'status-badge offline';
                discordStatusBadge.textContent = '○ Offline / Disconnected';
            }

            // Sync form values
            const enabledInput = document.getElementById('discord_enabled');
            if (enabledInput && typeof cfg.enabled === 'boolean') enabledInput.checked = cfg.enabled;

            const channelInput = document.getElementById('discord_channel_id');
            if (channelInput && cfg.channel_id) channelInput.value = cfg.channel_id;

            const prefixInput = document.getElementById('discord_prefix');
            if (prefixInput && cfg.prefix) prefixInput.value = cfg.prefix;

            const tokenInput = document.getElementById('discord_token');
            const tokenSavedBadge = document.getElementById('tokenSavedBadge');
            if (cfg.token || cfg.token_masked) {
                if (tokenInput) tokenInput.placeholder = '•••••••••••••••••••••••• (Saved)';
                if (tokenSavedBadge) tokenSavedBadge.style.display = 'inline-block';
            } else {
                if (tokenSavedBadge) tokenSavedBadge.style.display = 'none';
            }

            const adminIdsInput = document.getElementById('discord_admin_ids');
            if (adminIdsInput && cfg.admin_ids) adminIdsInput.value = (cfg.admin_ids || []).join(', ');

            const adminRolesInput = document.getElementById('discord_admin_role_ids');
            if (adminRolesInput && cfg.admin_role_ids) adminRolesInput.value = (cfg.admin_role_ids || []).join(', ');

            const publicStatusInput = document.getElementById('discord_allow_public_status');
            if (publicStatusInput && typeof cfg.allow_public_status === 'boolean') publicStatusInput.checked = cfg.allow_public_status;

            const notifyStart = document.getElementById('discord_notify_server_start');
            if (notifyStart && typeof cfg.notify_server_start === 'boolean') notifyStart.checked = cfg.notify_server_start;

            const notifyStop = document.getElementById('discord_notify_server_stop');
            if (notifyStop && typeof cfg.notify_server_stop === 'boolean') notifyStop.checked = cfg.notify_server_stop;

            const notifyJoinLeave = document.getElementById('discord_notify_player_join_leave');
            if (notifyJoinLeave && typeof cfg.notify_player_join_leave === 'boolean') notifyJoinLeave.checked = cfg.notify_player_join_leave;

            const notifyCrash = document.getElementById('discord_notify_server_crash');
            if (notifyCrash && typeof cfg.notify_server_crash === 'boolean') notifyCrash.checked = cfg.notify_server_crash;

        } catch (err) {
            console.error('Error fetching Discord status:', err);
        }
    }

    // Load status on initialization
    loadDiscordStatus();

    return { loadDiscordStatus };
}
