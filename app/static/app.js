import { initServerManager } from './js/server.js?v=6';
import { initInstaller } from './js/installer.js?v=6';
import { initModsManager } from './js/mods.js?v=6';
import { initMrpackUploader } from './js/mrpack.js?v=6';
import { initSettingsManager } from './js/settings.js?v=6';
import { initPlayersManager } from './js/players.js?v=6';
import { initDiscordManager } from './js/discord.js?v=6';
import { initMetricsManager } from './js/metrics.js?v=6';

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Subsystems
    initServerManager();
    const installer = initInstaller();
    const modsManager = initModsManager();
    const settingsManager = initSettingsManager();
    const playersManager = initPlayersManager();
    const discordManager = initDiscordManager();
    const metricsManager = initMetricsManager();

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
                metricsManager.onTabDeactivated();
            } else if (targetId === 'tab-mods') {
                modsManager.loadInstalledMods();
                modsManager.loadMods();
                installer.updateLoaderVersions();
                metricsManager.onTabDeactivated();
            } else if (targetId === 'tab-settings') {
                settingsManager.loadBackups();
                settingsManager.loadStorage();
                metricsManager.onTabDeactivated();
            } else if (targetId === 'tab-metrics') {
                metricsManager.onTabActivated();
            } else if (targetId === 'tab-discord') {
                discordManager.loadDiscordStatus();
                metricsManager.onTabDeactivated();
            } else {
                metricsManager.onTabDeactivated();
            }
        });
    });
});
