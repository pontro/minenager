// --- Visual Player & Moderation Controls ---
import { escapeHtml, showToast } from './utils.js';

export function initPlayersManager() {
    const playersList = document.getElementById('playersList');
    const onlinePlayersBadge = document.getElementById('onlinePlayersBadge');
    const btnRefreshPlayers = document.getElementById('btnRefreshPlayers');
    const btnQuickWhitelist = document.getElementById('btnQuickWhitelist');
    const inputQuickPlayer = document.getElementById('inputQuickPlayer');

    async function loadPlayers() {
        if (!playersList) return;
        try {
            const res = await fetch('/api/players');
            const data = await res.json();
            const online = data.online || [];
            const ops = data.ops || [];
            const whitelist = data.whitelist || [];
            const banned = data.banned || [];

            if (onlinePlayersBadge) {
                const count = online.length;
                onlinePlayersBadge.textContent = `${count} Online`;
                onlinePlayersBadge.className = count > 0 ? 'status-badge online' : 'status-badge offline';
            }

            const dashPlayers = document.getElementById('dashboardPlayers');
            if (dashPlayers) {
                const parts = dashPlayers.textContent.split('/');
                const max = parts.length > 1 ? parts[1].trim() : '10';
                dashPlayers.textContent = `${online.length} / ${max}`;
            }

            if (online.length === 0) {
                playersList.innerHTML = '<div class="empty-state" style="padding: 1.5rem 1rem;">No players currently online.</div>';
                return;
            }

            playersList.innerHTML = '';
            online.forEach(p => {
                const item = document.createElement('div');
                item.className = 'installed-card';
                item.style.padding = '0.75rem 1rem';

                const opBtnText = p.is_op ? '👑 Revoke OP' : '👑 Make OP';
                const opAction = p.is_op ? 'deop' : 'op';
                const opBtnClass = p.is_op ? 'btn-restart' : 'btn-start';

                const wlBtnText = p.is_whitelisted ? '🛡️ Unwhitelist' : '🛡️ Whitelist';
                const wlAction = p.is_whitelisted ? 'whitelist_remove' : 'whitelist_add';

                item.innerHTML = `
                    <div class="installed-card-main">
                        <img src="${escapeHtml(p.avatar_url)}" alt="${escapeHtml(p.name)}" style="width: 32px; height: 32px; border-radius: 6px; background: var(--bg-console); image-rendering: pixelated;" onerror="this.src='https://minotar.net/helm/Steve/32.png'">
                        <div class="installed-card-details">
                            <div class="installed-card-name" style="font-size: 1rem;">
                                ${escapeHtml(p.name)}
                                ${p.is_op ? '<span class="installed-badge badge-active" style="margin-left: 0.35rem; font-size: 0.7rem;">OP</span>' : ''}
                                ${p.is_whitelisted ? '<span class="installed-badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; margin-left: 0.35rem; font-size: 0.7rem;">Whitelist</span>' : ''}
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.4rem; flex-wrap: wrap;">
                        <button class="btn btn-sm ${opBtnClass}" data-player-action="${opAction}" data-player-name="${escapeHtml(p.name)}">
                            ${opBtnText}
                        </button>
                        <button class="btn btn-sm btn-send" data-player-action="${wlAction}" data-player-name="${escapeHtml(p.name)}">
                            ${wlBtnText}
                        </button>
                        <button class="btn btn-sm btn-restart" data-player-action="kick" data-player-name="${escapeHtml(p.name)}">
                            👢 Kick
                        </button>
                        <button class="btn btn-sm btn-danger" data-player-action="ban" data-player-name="${escapeHtml(p.name)}">
                            🔨 Ban
                        </button>
                    </div>
                `;
                playersList.appendChild(item);
            });
        } catch (err) {
            console.error('Error loading players:', err);
        }
    }

    playersList?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-player-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-player-action');
        const player = btn.getAttribute('data-player-name');

        let reason = null;
        if (action === 'kick' || action === 'ban') {
            reason = prompt(`Enter ${action} reason for ${player} (optional):`, 'Server moderation');
            if (reason === null) return; // User cancelled
        }

        btn.disabled = true;

        try {
            const res = await fetch('/api/players/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: action,
                    player: player,
                    reason: reason
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || `Action failed.`);

            showToast(`✔ ${data.message}`);
            setTimeout(loadPlayers, 800);
        } catch (err) {
            alert(`Player action error: ${err.message}`);
            btn.disabled = false;
        }
    });

    btnRefreshPlayers?.addEventListener('click', async () => {
        btnRefreshPlayers.disabled = true;
        await loadPlayers();
        btnRefreshPlayers.disabled = false;
        showToast('✔ Player list updated');
    });

    btnQuickWhitelist?.addEventListener('click', async () => {
        const player = inputQuickPlayer?.value.trim();
        if (!player) {
            alert('Please enter a Minecraft username.');
            return;
        }

        btnQuickWhitelist.disabled = true;
        try {
            const res = await fetch('/api/players/action', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'whitelist_add',
                    player: player
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to whitelist player.');

            showToast(`✔ Player "${player}" added to whitelist!`);
            if (inputQuickPlayer) inputQuickPlayer.value = '';
            loadPlayers();
        } catch (err) {
            alert(`Whitelist error: ${err.message}`);
        } finally {
            btnQuickWhitelist.disabled = false;
        }
    });

    // Initial load
    loadPlayers();

    return { loadPlayers };
}
