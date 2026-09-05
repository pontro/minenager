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

    // Save Discord Settings
    discordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (btnSaveDiscord) btnSaveDiscord.disabled = true;

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
            await loadDiscordStatus();
        } catch (err) {
            alert(`Error saving Discord settings: ${err.message}`);
        } finally {
            if (btnSaveDiscord) btnSaveDiscord.disabled = false;
        }
    });

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
                discordStatusBadge.textContent = `⚠️ Error: ${status.last_error ? status.last_error.slice(0, 20) : 'Disconnected'}`;
            } else {
                discordStatusBadge.className = 'status-badge offline';
                discordStatusBadge.textContent = '○ Offline / Disconnected';
            }
        } catch (err) {
            console.error('Error fetching Discord status:', err);
        }
    }

    return { loadDiscordStatus };
}
