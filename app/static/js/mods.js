// --- Modrinth Mods & Modal Management ---
import { escapeHtml, formatBytes, showToast } from './utils.js';

let installedMods = [];
let searchDebounceTimer = null;

export function initModsManager() {
    const modsContainer = document.getElementById('modsContainer');
    const modsResultCount = document.getElementById('modsResultCount');
    const modSearchInput = document.getElementById('modSearchInput');
    const installedCountBadge = document.getElementById('installedCountBadge');
    const installedSummaryText = document.getElementById('installedSummaryText');
    const installedModsModal = document.getElementById('installedModsModal');
    const btnOpenInstalledModal = document.getElementById('btnOpenInstalledModal');
    const btnCloseInstalledModal = document.getElementById('btnCloseInstalledModal');
    const modalModSearchInput = document.getElementById('modalModSearchInput');
    const modalModsCountBadge = document.getElementById('modalModsCountBadge');
    const modalInstalledModsList = document.getElementById('modalInstalledModsList');
    const installerMcVersion = document.getElementById('installerMcVersion');
    const installerLoader = document.getElementById('installerLoader');

    async function loadInstalledMods() {
        try {
            const res = await fetch('/api/mods/installed');
            const data = await res.json();
            installedMods = data.mods || [];
            
            const count = installedMods.length;
            const enabledCount = installedMods.filter(m => m.enabled).length;

            if (installedCountBadge) {
                installedCountBadge.textContent = `${count} Mod${count === 1 ? '' : 's'}`;
                installedCountBadge.className = count > 0 ? 'status-badge online' : 'status-badge offline';
            }
            if (modalModsCountBadge) {
                modalModsCountBadge.textContent = `${enabledCount}/${count} Active`;
            }
            if (installedSummaryText) {
                installedSummaryText.textContent = count > 0 
                    ? `${count} mod${count === 1 ? '' : 's'} found (${enabledCount} enabled, ${count - enabledCount} disabled). Click below to manage.`
                    : 'No mods currently installed in /data/minecraft/mods/. Search below to add mods.';
            }

            renderModalInstalledMods();
        } catch (err) {
            console.error('Error loading installed mods:', err);
        }
    }

    function renderModalInstalledMods() {
        if (!modalInstalledModsList) return;
        const query = (modalModSearchInput?.value || '').toLowerCase().trim();

        const filtered = installedMods.filter(m => {
            if (!query) return true;
            return m.filename.toLowerCase().includes(query);
        });

        if (filtered.length === 0) {
            modalInstalledModsList.innerHTML = query 
                ? `<div class="empty-state">No installed mods matching "<strong>${escapeHtml(query)}</strong>"</div>`
                : '<div class="empty-state">No mods installed in <code>/data/minecraft/mods/</code> yet.</div>';
            return;
        }

        modalInstalledModsList.innerHTML = '';
        filtered.forEach(m => {
            const item = document.createElement('div');
            item.className = 'installed-card';

            const badgeClass = m.enabled ? 'badge-active' : 'badge-disabled';
            const badgeLabel = m.enabled ? 'Active' : 'Disabled';
            const toggleAction = m.enabled ? 'disable' : 'enable';
            const toggleBtnText = m.enabled ? 'Disable' : 'Enable';
            const toggleBtnClass = m.enabled ? 'btn-restart' : 'btn-start';

            item.innerHTML = `
                <div class="installed-card-main">
                    <span class="installed-card-icon">📦</span>
                    <div class="installed-card-details">
                        <div class="installed-card-name">${escapeHtml(m.filename)}</div>
                        <div class="installed-card-meta">
                            <span>${formatBytes(m.size)}</span>
                            <span class="installed-badge ${badgeClass}">${badgeLabel}</span>
                        </div>
                    </div>
                </div>
                <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
                    <button class="btn btn-sm ${toggleBtnClass}" data-action="${toggleAction}" data-file="${escapeHtml(m.filename)}">
                        ${toggleBtnText}
                    </button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-file="${escapeHtml(m.filename)}">
                        Delete
                    </button>
                </div>
            `;
            modalInstalledModsList.appendChild(item);
        });
    }

    modalInstalledModsList?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.getAttribute('data-action');
        const filename = btn.getAttribute('data-file');

        if (action === 'delete') {
            if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
            try {
                btn.disabled = true;
                const res = await fetch(`/api/mods/installed/${encodeURIComponent(filename)}`, { method: 'DELETE' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'Failed to delete mod');
                showToast(`🗑️ ${filename} removed`);
                await loadInstalledMods();
                loadMods();
            } catch (err) {
                alert(`Delete error: ${err.message}`);
                btn.disabled = false;
            }
        } else if (action === 'enable' || action === 'disable') {
            try {
                btn.disabled = true;
                const endpoint = action === 'enable' 
                    ? `/api/mods/installed/${encodeURIComponent(filename)}/enable`
                    : `/api/mods/installed/${encodeURIComponent(filename)}/disable`;
                const res = await fetch(endpoint, { method: 'POST' });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || `Failed to ${action} mod`);
                showToast(`✔ Mod ${action}d!`);
                await loadInstalledMods();
            } catch (err) {
                alert(`Error: ${err.message}`);
                btn.disabled = false;
            }
        }
    });

    btnOpenInstalledModal?.addEventListener('click', () => {
        if (installedModsModal) {
            installedModsModal.style.display = 'flex';
            if (modalModSearchInput) {
                modalModSearchInput.value = '';
                modalModSearchInput.focus();
            }
            renderModalInstalledMods();
        }
    });

    btnCloseInstalledModal?.addEventListener('click', () => {
        if (installedModsModal) installedModsModal.style.display = 'none';
    });

    installedModsModal?.addEventListener('click', (e) => {
        if (e.target === installedModsModal) {
            installedModsModal.style.display = 'none';
        }
    });

    modalModSearchInput?.addEventListener('input', () => {
        renderModalInstalledMods();
    });

    async function loadMods() {
        if (!modsContainer) return;
        const q = modSearchInput?.value.trim() || '';
        const version = installerMcVersion?.value || '1.20.1';
        const loader = (installerLoader?.value || 'fabric').toLowerCase();

        modsContainer.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <div>Searching compatible mods for ${escapeHtml(version)} (${escapeHtml(loader)})...</div>
            </div>
        `;

        try {
            const params = new URLSearchParams({ q, version, loader, limit: '20' });
            const res = await fetch(`/api/mods/search?${params.toString()}`);
            const data = await res.json();
            const hits = data.hits || [];

            if (modsResultCount) {
                modsResultCount.textContent = `${hits.length} mods found`;
            }

            if (hits.length === 0) {
                modsContainer.innerHTML = `
                    <div class="empty-state">
                        <div>No mods found matching your filters for Minecraft ${escapeHtml(version)} (${escapeHtml(loader)}).</div>
                        <div style="margin-top: 0.5rem; font-size: 0.85rem;">Try searching for Sodium, Lithium, FerriteCore, or Voice Chat.</div>
                    </div>
                `;
                return;
            }

            modsContainer.innerHTML = '';
            hits.forEach(mod => {
                const card = document.createElement('div');
                card.className = 'mod-card';

                const isInstalled = installedMods.some(m => {
                    const clean = m.filename.toLowerCase();
                    const slug = (mod.slug || '').toLowerCase();
                    return clean.includes(slug) && !clean.endsWith('.disabled');
                });

                const iconHtml = mod.icon_url 
                    ? `<img src="${escapeHtml(mod.icon_url)}" class="mod-icon" alt="${escapeHtml(mod.title)}" loading="lazy">`
                    : `<div class="mod-icon-placeholder">📦</div>`;

                const downloadsFormatted = (mod.downloads || 0).toLocaleString();
                const followsFormatted = (mod.follows || 0).toLocaleString();

                const actionBtnHtml = isInstalled
                    ? `<button class="btn btn-sm btn-installed" disabled>✓ Installed</button>`
                    : `<button class="btn btn-sm btn-install" data-project-id="${escapeHtml(mod.project_id)}" data-slug="${escapeHtml(mod.slug)}" data-title="${escapeHtml(mod.title)}">⬇ Install</button>`;

                card.innerHTML = `
                    ${iconHtml}
                    <div class="mod-details">
                        <div class="mod-title-row">
                            <h3 class="mod-title">${escapeHtml(mod.title)}</h3>
                            <span class="mod-author">by ${escapeHtml(mod.author || 'Unknown')}</span>
                        </div>
                        <p class="mod-desc">${escapeHtml(mod.description || 'No description provided.')}</p>
                        <div class="mod-meta">
                            <span>⬇ ${downloadsFormatted} downloads</span>
                            <span>⭐ ${followsFormatted} followers</span>
                            <span>🏷️ ${escapeHtml(mod.categories?.join(', ') || 'Mod')}</span>
                        </div>
                    </div>
                    <div class="mod-actions">
                        ${actionBtnHtml}
                    </div>
                `;

                modsContainer.appendChild(card);
            });
        } catch (err) {
            console.error('Error searching mods:', err);
            modsContainer.innerHTML = `<div class="empty-state" style="color: var(--status-offline);">Failed to load mods from Modrinth API.</div>`;
        }
    }

    modsContainer?.addEventListener('click', async (e) => {
        const btn = e.target.closest('button.btn-install');
        if (!btn) return;

        const projectId = btn.getAttribute('data-project-id');
        const title = btn.getAttribute('data-title');
        const mc = installerMcVersion?.value;
        const loader = installerLoader?.value;

        btn.disabled = true;
        btn.textContent = '⏳ Installing...';

        try {
            const res = await fetch(`/api/mods/install/${encodeURIComponent(projectId)}?mc_version=${encodeURIComponent(mc)}&loader=${encodeURIComponent(loader)}`, {
                method: 'POST'
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Installation failed');

            const depsCount = (data.installed_dependencies || []).length;
            const depMsg = depsCount > 0 ? ` (+${depsCount} dependencies installed)` : '';
            showToast(`✔ Installed ${title}${depMsg}!`);

            btn.className = 'btn btn-sm btn-installed';
            btn.textContent = '✓ Installed';

            await loadInstalledMods();
        } catch (err) {
            alert(`Install error: ${err.message}`);
            btn.disabled = false;
            btn.textContent = '⬇ Install';
        }
    });

    modSearchInput?.addEventListener('input', () => {
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            loadMods();
        }, 350);
    });

    return { loadInstalledMods, loadMods };
}
