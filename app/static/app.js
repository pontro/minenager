// --- Main Application Bootstrapper ---
import { initServerManager } from './js/server.js';
import { initInstaller } from './js/installer.js';
import { initModsManager } from './js/mods.js';
import { initMrpackUploader } from './js/mrpack.js';
import { initSettingsManager } from './js/settings.js';
import { initPlayersManager } from './js/players.js';
import { initDiscordManager } from './js/discord.js';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Subsystems
    initServerManager();
    const installer = initInstaller();
    const modsManager = initModsManager();
    const settingsManager = initSettingsManager();
    const playersManager = initPlayersManager();
    const discordManager = initDiscordManager();

    initMrpackUploader(() => {
        modsManager.loadInstalledMods();
        modsManager.loadMods();
    });

    // 2. Tab Navigation
    const navButtons = document.querySelectorAll('.nav-link[data-tab]');
    const tabPanes = document.querySelectorAll('.tab-pane');

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab');
            navButtons.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            btn.classList.add('active');
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            if (targetId === 'tab-server') {
                playersManager.loadPlayers();
            } else if (targetId === 'tab-mods') {
                modsManager.loadInstalledMods();
                modsManager.loadMods();
                installer.updateLoaderVersions();
            } else if (targetId === 'tab-settings') {
                settingsManager.loadBackups();
                settingsManager.loadStorage();
            } else if (targetId === 'tab-discord') {
                discordManager.loadDiscordStatus();
            }
        });
    });
});
