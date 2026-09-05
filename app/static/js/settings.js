// --- Server Settings, RAM Sliders, Backups & Reset ---
import { escapeHtml, showToast } from './utils.js';

export function initSettingsManager() {
    const settingRamRange = document.getElementById('settingRamRange');
    const ramDisplayBadge = document.getElementById('ramDisplayBadge');
    const settingMinRam = document.getElementById('settingMinRam');
    const minRamDisplayBadge = document.getElementById('minRamDisplayBadge');
    const settingsForm = document.getElementById('settingsForm');

    settingRamRange?.addEventListener('input', () => {
        if (ramDisplayBadge) {
            ramDisplayBadge.textContent = `${settingRamRange.value} GB`;
        }
        const maxVal = parseInt(settingRamRange.value, 10);
        const minVal = parseInt(settingMinRam?.value || '1', 10);
        if (maxVal < minVal) {
            if (settingMinRam) settingMinRam.value = maxVal;
            if (minRamDisplayBadge) minRamDisplayBadge.textContent = `${maxVal} GB`;
        }
    });

    settingMinRam?.addEventListener('input', () => {
        if (minRamDisplayBadge) {
            minRamDisplayBadge.textContent = `${settingMinRam.value} GB`;
        }
        const minVal = parseInt(settingMinRam.value, 10);
        const maxVal = parseInt(settingRamRange.value, 10);
        if (minVal > maxVal) {
            settingRamRange.value = minVal;
            if (ramDisplayBadge) ramDisplayBadge.textContent = `${minVal} GB`;
        }
    });

    // Max Players numerical validation (1 to 10)
    const propMaxPlayers = document.getElementById('prop_max_players');
    propMaxPlayers?.addEventListener('input', () => {
        let val = parseInt(propMaxPlayers.value, 10);
        if (isNaN(val)) return;
        if (val > 10) propMaxPlayers.value = 10;
        if (val < 1) propMaxPlayers.value = 1;
    });

    // View Distance & Simulation Distance Live Badges
    const propViewDistance = document.getElementById('prop_view_distance');
    const badgeViewDistance = document.getElementById('badge_view_distance');
    propViewDistance?.addEventListener('input', () => {
        if (badgeViewDistance) badgeViewDistance.textContent = `${propViewDistance.value} Chunks`;
    });

    const propSimDistance = document.getElementById('prop_simulation_distance');
    const badgeSimDistance = document.getElementById('badge_simulation_distance');
    propSimDistance?.addEventListener('input', () => {
        if (badgeSimDistance) badgeSimDistance.textContent = `${propSimDistance.value} Chunks`;
    });

    settingsForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnSaveTop = document.getElementById('btnSaveSettingsTop');
        if (btnSaveTop) btnSaveTop.disabled = true;

        const ram_gb = parseInt(document.getElementById('settingRamRange')?.value || '4', 10);
        const min_ram_gb = parseInt(document.getElementById('settingMinRam')?.value || '1', 10);

        const properties = {
            'gamemode': document.getElementById('prop_gamemode')?.value || 'survival',
            'difficulty': document.getElementById('prop_difficulty')?.value || 'easy',
            'max-players': document.getElementById('prop_max_players')?.value || '10',
            'level-name': document.getElementById('prop_level_name')?.value || 'world',
            'online-mode': document.getElementById('prop_online_mode')?.checked ? 'true' : 'false',
            'pvp': document.getElementById('prop_pvp')?.checked ? 'true' : 'false',
            'white-list': document.getElementById('prop_white_list')?.checked ? 'true' : 'false',
            'allow-flight': document.getElementById('prop_allow_flight')?.checked ? 'true' : 'false',
            'view-distance': document.getElementById('prop_view_distance')?.value || '10',
            'simulation-distance': document.getElementById('prop_simulation_distance')?.value || '10',
            'spawn-monsters': document.getElementById('prop_spawn_monsters')?.checked ? 'true' : 'false',
            'enable-command-block': document.getElementById('prop_enable_command_block')?.checked ? 'true' : 'false',
            'motd': document.getElementById('prop_motd')?.value || 'A Minecraft Server',
            'server-port': '25565'
        };

        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ram_gb: ram_gb,
                    min_ram_gb: min_ram_gb,
                    properties: properties
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to save settings');

            const dashRam = document.getElementById('dashboardRam');
            if (dashRam) dashRam.textContent = `${ram_gb} GB`;

            const dashPlayers = document.getElementById('dashboardPlayers');
            if (dashPlayers) dashPlayers.textContent = `0 / ${properties['max-players']}`;

            showToast('✔ Server settings saved successfully!');
        } catch (err) {
            alert(`Error saving settings: ${err.message}`);
        } finally {
            if (btnSaveTop) btnSaveTop.disabled = false;
        }
    });

    // --- Backups Management ---
    const btnCreateBackup = document.getElementById('btnCreateBackup');
    const btnRefreshBackups = document.getElementById('btnRefreshBackups');
    const backupsList = document.getElementById('backupsList');
    const backupCountBadge = document.getElementById('backupCountBadge');
    const backupLiveStatusBanner = document.getElementById('backupLiveStatusBanner');
    const backupLiveStatusText = document.getElementById('backupLiveStatusText');

    btnCreateBackup?.addEventListener('click', async () => {
        const statusBadge = document.getElementById('statusBadge');
        const isOnline = (statusBadge && statusBadge.classList.contains('online'));
        const msg = isOnline
            ? '💾 Start Backup Routine?\n\nThe server will:\n1. Broadcast a 1-minute countdown in game chat\n2. Save world and cleanly shut down\n3. Create world backup in /data/backups/ (CDMX time)\n4. Automatically reopen the server\n\nContinue?'
            : '💾 Create a backup of the world in /data/backups/ now?';

        if (!confirm(msg)) return;

        btnCreateBackup.disabled = true;
        showToast('⏳ Backup routine initiated! Check live console.');

        try {
            const res = await fetch('/api/backups/create', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to start backup');
            showToast('✔ Backup running in background!');
            loadBackups();
        } catch (err) {
            alert(`Backup error: ${err.message}`);
        } finally {
            setTimeout(() => {
                if (btnCreateBackup) btnCreateBackup.disabled = false;
            }, 3000);
        }
    });

    btnRefreshBackups?.addEventListener('click', async () => {
        btnRefreshBackups.disabled = true;
        btnRefreshBackups.textContent = '⏳ Reloading...';
        await loadBackups();
        btnRefreshBackups.disabled = false;
        btnRefreshBackups.textContent = '🔄 Reload Backups';
        showToast('✔ Backups list reloaded');
    });

    async function loadBackups() {
        if (!backupsList) return;
        try {
            const res = await fetch('/api/backups');
            const data = await res.json();
            const list = data.backups || [];
            const count = list.length;
            const max = data.max || 7;
            const status = data.status || {};

            if (backupCountBadge) {
                backupCountBadge.textContent = `${count} / ${max} Saved`;
                backupCountBadge.className = count > 0 ? 'status-badge online' : 'status-badge offline';
            }

            if (backupLiveStatusBanner && backupLiveStatusText) {
                if (status.is_busy) {
                    backupLiveStatusBanner.style.display = 'block';
                    backupLiveStatusText.textContent = `[${status.action.toUpperCase()}] ${status.message || 'Operation in progress...'}`;
                } else {
                    backupLiveStatusBanner.style.display = 'none';
                }
            }

            if (list.length === 0) {
                backupsList.innerHTML = '<div class="empty-state">No backups created in /data/backups/ yet.</div>';
                return;
            }

            backupsList.innerHTML = '';
            list.forEach(b => {
                const item = document.createElement('div');
                item.className = 'installed-card';

                item.innerHTML = `
                    <div class="installed-card-main">
                        <span class="installed-card-icon">💾</span>
                        <div class="installed-card-details">
                            <div class="installed-card-name">${escapeHtml(b.filename)}</div>
                            <div class="installed-card-meta">
                                <span>📅 ${escapeHtml(b.created_at)}</span>
                                <span>📦 ${escapeHtml(b.size_formatted)}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                        <button class="btn btn-sm btn-restart" data-action="restore-backup" data-file="${escapeHtml(b.filename)}">
                            🔄 Restore
                        </button>
                        <button class="btn btn-sm btn-danger" data-action="delete-backup" data-file="${escapeHtml(b.filename)}">
                            🗑️ Delete
                        </button>
                    </div>
                `;
                backupsList.appendChild(item);
            });
        } catch (err) {
            console.error('Error loading backups:', err);
            backupsList.innerHTML = '<div class="empty-state" style="color: var(--status-offline);">Failed to load backups.</div>';
        }
    }

    backupsList?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const filename = btn.getAttribute('data-file');

        if (action === 'restore-backup') {
            const confirmed = confirm(`⚠️ RESTORE WORLD BACKUP?\n\nFile: ${filename}\n\nThe server will:\n1. Stop the server safely (if running)\n2. Replace current world terrain/inventories with this backup\n3. Automatically reopen the server\n\nContinue?`);
            if (!confirmed) return;

            btn.disabled = true;
            showToast(`⏳ Restoring backup "${filename}"...`);

            try {
                const res = await fetch('/api/backups/restore', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ filename: filename })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed to restore backup');
                showToast('✔ Backup restore routine initiated! Check live console.');
                loadBackups();
            } catch (err) {
                alert(`Restore error: ${err.message}`);
                btn.disabled = false;
            }
        } else if (action === 'delete-backup') {
            if (!confirm(`Are you sure you want to permanently delete backup "${filename}"?`)) return;
            btn.disabled = true;
            try {
                const res = await fetch(`/api/backups/delete?filename=${encodeURIComponent(filename)}`, { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed to delete backup');
                showToast(`🗑️ Backup "${filename}" deleted.`);
                loadBackups();
            } catch (err) {
                alert(`Delete error: ${err.message}`);
                btn.disabled = false;
            }
        }
    });

    // --- Delete World Data ---
    const btnDeleteWorld = document.getElementById('btnDeleteWorld');
    btnDeleteWorld?.addEventListener('click', async () => {
        const confirmed = confirm('🌍 Are you sure you want to delete the world save data? This will reset all world terrain, player inventories, and advancements, but will KEEP your installed mods, loader, and server configuration.');
        if (!confirmed) return;

        btnDeleteWorld.disabled = true;
        btnDeleteWorld.textContent = '⏳ Deleting world...';

        try {
            const res = await fetch('/api/settings/delete-world', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to delete world data');

            showToast('🌍 World data deleted! A new world will generate on next start.');
        } catch (err) {
            alert(`World reset error: ${err.message}`);
        } finally {
            btnDeleteWorld.disabled = false;
            btnDeleteWorld.textContent = '🗑️ Delete World Data';
        }
    });

    // --- Delete All & Start from 0 ---
    const btnResetServer = document.getElementById('btnResetServer');
    btnResetServer?.addEventListener('click', async () => {
        const firstConfirm = confirm('⚠️ DANGER: DELETE ALL SERVER DATA?\n\nThis will completely erase all installed mods, server .jar, world terrain, configs, and instance configuration.\n\nBackups in /data/backups/ will NOT be touched.\n\nAre you sure you want to proceed?');
        if (!firstConfirm) return;

        const secondConfirm = confirm('🚨 FINAL CONFIRMATION: Type YES in your mind and press OK to permanently wipe /data/minecraft/ and start from zero.');
        if (!secondConfirm) return;

        btnResetServer.disabled = true;
        btnResetServer.textContent = '⏳ Wiping all server files...';

        try {
            const res = await fetch('/api/settings/reset', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Reset failed');

            alert('Server has been reset to 0! The page will now reload.');
            window.location.reload();
        } catch (err) {
            alert(`Reset error: ${err.message}`);
            btnResetServer.disabled = false;
            btnResetServer.textContent = '🗑️ Delete All & Start from 0';
        }
    });

    // --- Storage Breakdown & Log Cleaner (Idea 7) ---
    const storageTotalBadge = document.getElementById('storageTotalBadge');
    const storageWorld = document.getElementById('storageWorld');
    const storageBackups = document.getElementById('storageBackups');
    const storageMods = document.getElementById('storageMods');
    const storageLogs = document.getElementById('storageLogs');
    const storageFreeDisk = document.getElementById('storageFreeDisk');
    const btnCleanLogs = document.getElementById('btnCleanLogs');
    const btnRefreshStorage = document.getElementById('btnRefreshStorage');

    async function loadStorage() {
        if (!storageWorld) return;
        try {
            const res = await fetch('/api/storage');
            const data = await res.json();

            if (storageTotalBadge) storageTotalBadge.textContent = `${data.total_server_formatted} Used`;
            if (storageWorld) storageWorld.textContent = data.world_formatted;
            if (storageBackups) storageBackups.textContent = data.backups_formatted;
            if (storageMods) storageMods.textContent = data.mods_formatted;
            if (storageLogs) storageLogs.textContent = data.logs_formatted;
            if (storageFreeDisk) storageFreeDisk.textContent = data.free_disk_formatted;
        } catch (err) {
            console.error('Error loading storage info:', err);
        }
    }

    btnCleanLogs?.addEventListener('click', async () => {
        if (!confirm('🧹 Clean old log archives (.log.gz) and crash dumps to free up disk space?')) return;
        btnCleanLogs.disabled = true;
        btnCleanLogs.textContent = '⏳ Cleaning...';
        try {
            const res = await fetch('/api/storage/clean-logs', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Clean failed');
            showToast(`✔ ${data.message}`);
            await loadStorage();
        } catch (err) {
            alert(`Clean error: ${err.message}`);
        } finally {
            btnCleanLogs.disabled = false;
            btnCleanLogs.textContent = '🧹 Clean Old Logs & Dumps';
        }
    });

    btnRefreshStorage?.addEventListener('click', async () => {
        btnRefreshStorage.disabled = true;
        await loadStorage();
        btnRefreshStorage.disabled = false;
        showToast('✔ Storage usage updated');
    });

    return { loadBackups, loadStorage };
}
