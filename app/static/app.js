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

    // 2. Sidebar Toggle & State Persistence (UX Enhancement 1)
    const appSidebar = document.getElementById('appSidebar');
    const btnToggleSidebar = document.getElementById('btnToggleSidebar');
    const btnMobileMenu = document.getElementById('btnMobileMenu');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    // Restore desktop sidebar collapsed state
    if (localStorage.getItem('minenager_sidebar_collapsed') === 'true') {
        appSidebar?.classList.add('collapsed');
    }

    btnToggleSidebar?.addEventListener('click', () => {
        appSidebar?.classList.toggle('collapsed');
        const isCollapsed = appSidebar?.classList.contains('collapsed');
        localStorage.setItem('minenager_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    });

    // Mobile Drawer Open / Close
    btnMobileMenu?.addEventListener('click', () => {
        appSidebar?.classList.add('mobile-open');
        sidebarOverlay?.classList.add('active');
    });

    sidebarOverlay?.addEventListener('click', () => {
        appSidebar?.classList.remove('mobile-open');
        sidebarOverlay?.classList.remove('active');
    });

    // 3. Tab Navigation
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

            // Close mobile menu on navigation
            appSidebar?.classList.remove('mobile-open');
            sidebarOverlay?.classList.remove('active');

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
