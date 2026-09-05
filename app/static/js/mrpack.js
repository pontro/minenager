// --- .mrpack Upload Handling ---
import { showToast } from './utils.js';

export function initMrpackUploader(onPackInstalled) {
    const mrpackDropzone = document.getElementById('mrpackDropzone');
    const mrpackFileInput = document.getElementById('mrpackFileInput');
    const btnBrowseMrpack = document.getElementById('btnBrowseMrpack');
    const mrpackUploadStatus = document.getElementById('mrpackUploadStatus');
    const mrpackProgressBar = document.getElementById('mrpackProgressBar');
    const mrpackStatusText = document.getElementById('mrpackStatusText');
    const mrpackPercentText = document.getElementById('mrpackPercentText');
    const mrpackDetails = document.getElementById('mrpackDetails');
    const installerMcVersion = document.getElementById('installerMcVersion');
    const installerLoader = document.getElementById('installerLoader');
    const installerLoaderVersion = document.getElementById('installerLoaderVersion');
    const btnChangeInstaller = document.getElementById('btnChangeInstaller');
    const btnInstallServer = document.getElementById('btnInstallServer');
    const installerLockBadge = document.getElementById('installerLockBadge');

    btnBrowseMrpack?.addEventListener('click', (e) => {
        e.stopPropagation();
        mrpackFileInput?.click();
    });

    mrpackDropzone?.addEventListener('click', () => {
        mrpackFileInput?.click();
    });

    mrpackDropzone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        mrpackDropzone.classList.add('dragover');
    });

    mrpackDropzone?.addEventListener('dragleave', () => {
        mrpackDropzone.classList.remove('dragover');
    });

    mrpackDropzone?.addEventListener('drop', (e) => {
        e.preventDefault();
        mrpackDropzone.classList.remove('dragover');
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleMrpackFile(e.dataTransfer.files[0]);
        }
    });

    mrpackFileInput?.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleMrpackFile(e.target.files[0]);
        }
    });

    async function handleMrpackFile(file) {
        if (!file) return;

        mrpackUploadStatus.style.display = 'block';
        mrpackProgressBar.style.width = '20%';
        mrpackProgressBar.style.backgroundColor = 'var(--accent-emerald)';
        mrpackStatusText.textContent = `Uploading ${file.name} (${Math.round(file.size / 1024)} KB)...`;
        mrpackPercentText.textContent = '20%';
        mrpackDetails.innerHTML = 'Reading pack archive and analyzing dependencies...';

        try {
            const arrayBuffer = await file.arrayBuffer();
            mrpackProgressBar.style.width = '50%';
            mrpackStatusText.textContent = 'Parsing modrinth.index.json and downloading server mods...';
            mrpackPercentText.textContent = '50%';

            const res = await fetch('/api/mrpack/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/octet-stream' },
                body: arrayBuffer
            });

            const result = await res.json();
            if (!res.ok) {
                throw new Error(result.detail || 'Pack installation failed.');
            }

            mrpackProgressBar.style.width = '100%';
            mrpackStatusText.textContent = `✔ Successfully installed "${result.name}"!`;
            mrpackPercentText.textContent = '100%';

            let detailsHtml = `<strong>Pack:</strong> ${result.name} (${result.version_id || 'v1.0'})<br>`;
            detailsHtml += `<strong>Game:</strong> Minecraft ${result.game_version} (${result.loader.toUpperCase()})<br>`;
            detailsHtml += `<strong>Files installed:</strong> ${result.installed_files_count} mod(s) added to /data/minecraft/mods/`;
            mrpackDetails.innerHTML = detailsHtml;

            // Automatically fill and lock Server Software & Version card
            if (installerMcVersion) {
                let foundOption = false;
                for (let i = 0; i < installerMcVersion.options.length; i++) {
                    if (installerMcVersion.options[i].value === result.game_version) {
                        installerMcVersion.selectedIndex = i;
                        foundOption = true;
                        break;
                    }
                }
                if (!foundOption) {
                    const newOpt = new Option(result.game_version, result.game_version, true, true);
                    installerMcVersion.add(newOpt);
                }
                installerMcVersion.disabled = true;
            }

            if (installerLoader) {
                installerLoader.value = result.loader.toLowerCase();
                installerLoader.disabled = true;
            }

            if (installerLoaderVersion) {
                installerLoaderVersion.innerHTML = `<option value="latest" selected>Pack Default (${result.loader})</option>`;
                installerLoaderVersion.disabled = true;
            }

            if (btnInstallServer) btnInstallServer.style.display = 'none';
            if (btnChangeInstaller) btnChangeInstaller.style.display = 'inline-flex';
            if (installerLockBadge) {
                installerLockBadge.className = 'status-badge online';
                installerLockBadge.textContent = '● Installed & Locked (.mrpack)';
            }

            const dashName = document.getElementById('dashboardPackName');
            const dashMc = document.getElementById('dashboardMcVersion');
            const dashLoader = document.getElementById('dashboardLoader');
            if (dashName) dashName.textContent = result.name;
            if (dashMc) dashMc.textContent = result.game_version;
            if (dashLoader) dashLoader.textContent = result.loader;

            showToast(`✔ Modpack "${result.name}" installed successfully!`);

            if (onPackInstalled) onPackInstalled();

        } catch (err) {
            console.error('Error uploading mrpack:', err);
            mrpackProgressBar.style.width = '100%';
            mrpackProgressBar.style.backgroundColor = 'var(--status-offline)';
            mrpackStatusText.textContent = `❌ Error: ${err.message}`;
            mrpackPercentText.textContent = 'Failed';
            mrpackDetails.innerHTML = '<span style="color: var(--status-offline);">Please ensure this is a valid Modrinth .mrpack bundle file.</span>';
        }
    }
}
