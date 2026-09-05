// --- Server Software & Version Installer ---
import { showToast } from './utils.js';

export function initInstaller() {
    const installerMcVersion = document.getElementById('installerMcVersion');
    const installerLoader = document.getElementById('installerLoader');
    const installerLoaderVersion = document.getElementById('installerLoaderVersion');
    const btnInstallServer = document.getElementById('btnInstallServer');
    const btnChangeInstaller = document.getElementById('btnChangeInstaller');
    const installerLockBadge = document.getElementById('installerLockBadge');

    async function updateLoaderVersions() {
        if (!installerMcVersion || !installerLoader || !installerLoaderVersion) return;
        const mc = installerMcVersion.value;
        const loader = installerLoader.value;
        const isLocked = installerMcVersion.disabled;
        const currentSelectedVal = installerLoaderVersion.value;

        if (loader === 'vanilla') {
            installerLoaderVersion.innerHTML = '<option value="latest">Official Mojang Vanilla</option>';
            installerLoaderVersion.disabled = true;
            return;
        }

        installerLoaderVersion.innerHTML = '<option value="">Loading versions...</option>';

        try {
            const res = await fetch(`/api/installer/loader-versions?version=${encodeURIComponent(mc)}&loader=${encodeURIComponent(loader)}`);
            const data = await res.json();
            const versions = data.versions || data.loader_versions || [];

            installerLoaderVersion.innerHTML = '';
            if (versions.length === 0) {
                installerLoaderVersion.innerHTML = '<option value="latest">Latest Stable</option>';
            } else {
                versions.forEach((ver, index) => {
                    const opt = document.createElement('option');
                    opt.value = ver;
                    opt.textContent = (index === 0) ? `${ver} (Latest)` : ver;
                    if (ver === currentSelectedVal) {
                        opt.selected = true;
                    }
                    installerLoaderVersion.appendChild(opt);
                });
            }
        } catch (err) {
            console.error('Error fetching loader versions:', err);
            installerLoaderVersion.innerHTML = '<option value="latest">Latest</option>';
        } finally {
            installerLoaderVersion.disabled = isLocked;
        }
    }

    installerMcVersion?.addEventListener('change', updateLoaderVersions);
    installerLoader?.addEventListener('change', updateLoaderVersions);

    btnChangeInstaller?.addEventListener('click', () => {
        if (installerMcVersion) installerMcVersion.disabled = false;
        if (installerLoader) installerLoader.disabled = false;
        if (installerLoaderVersion && installerLoader.value !== 'vanilla') installerLoaderVersion.disabled = false;

        btnChangeInstaller.style.display = 'none';
        if (btnInstallServer) btnInstallServer.style.display = 'inline-flex';
        if (installerLockBadge) {
            installerLockBadge.className = 'status-badge offline';
            installerLockBadge.textContent = '○ Editing (Unlocked)';
        }
        updateLoaderVersions();
    });

    btnInstallServer?.addEventListener('click', async () => {
        const mc = installerMcVersion?.value;
        const loader = installerLoader?.value;
        const loader_ver = installerLoaderVersion?.value || 'latest';

        if (!mc || !loader) {
            alert('Please select a Minecraft version and mod loader.');
            return;
        }

        btnInstallServer.disabled = true;
        btnInstallServer.textContent = '⏳ Installing...';

        try {
            const res = await fetch('/api/installer/install', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mc_version: mc,
                    minecraft_version: mc,
                    loader: loader,
                    loader_version: loader_ver
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Installation failed');

            showToast(`✔ Server ${data.loader.toUpperCase()} ${data.version} installed!`);

            if (installerMcVersion) installerMcVersion.disabled = true;
            if (installerLoader) installerLoader.disabled = true;
            if (installerLoaderVersion) installerLoaderVersion.disabled = true;

            btnInstallServer.style.display = 'none';
            if (btnChangeInstaller) btnChangeInstaller.style.display = 'inline-flex';
            if (installerLockBadge) {
                installerLockBadge.className = 'status-badge online';
                installerLockBadge.textContent = '● Installed & Locked';
            }

            const dashMc = document.getElementById('dashboardMcVersion');
            const dashLoader = document.getElementById('dashboardLoader');
            if (dashMc) dashMc.textContent = data.version;
            if (dashLoader) dashLoader.textContent = data.loader;

        } catch (err) {
            alert(`Installation error: ${err.message}`);
        } finally {
            btnInstallServer.disabled = false;
            btnInstallServer.textContent = '⬇ Install Server';
        }
    });

    // Initial load of loader versions
    updateLoaderVersions();

    return { updateLoaderVersions };
}
