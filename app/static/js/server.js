// --- Live Server Process & Upgraded Console Management ---
import { escapeHtml, showToast } from './utils.js';

let lastSeenLogId = 0;
let commandHistory = [];
let historyIndex = -1;
let rawLogs = [];

export function initServerManager() {
    const consoleOutput = document.getElementById('consoleOutput');
    const commandForm = document.getElementById('commandForm');
    const commandInput = document.getElementById('commandInput');
    const btnStart = document.getElementById('btnStart');
    const btnStop = document.getElementById('btnStop');
    const btnRestart = document.getElementById('btnRestart');
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    // Sidebar status & version
    const sidebarStatusBadge = document.getElementById('sidebarStatusBadge');
    const sidebarStatusText = document.getElementById('sidebarStatusText');
    const sidebarPackInfo = document.getElementById('sidebarPackInfo');
    const mobileStatusBadge = document.getElementById('mobileStatusBadge');

    // Overview Card DOM elements
    const dashboardPackName = document.getElementById('dashboardPackName');
    const dashboardMcVersion = document.getElementById('dashboardMcVersion');
    const dashboardLoader = document.getElementById('dashboardLoader');
    const dashboardLocalIp = document.getElementById('dashboardLocalIp');
    const btnCopyLocalIp = document.getElementById('btnCopyLocalIp');
    const dashboardPublicIp = document.getElementById('dashboardPublicIp');
    const dashboardVanillaIp = document.getElementById('dashboardVanillaIp');
    const tunnelStatusBadge = document.getElementById('tunnelStatusBadge');
    const btnCopyPublicIp = document.getElementById('btnCopyPublicIp');
    const btnCopyVanillaIp = document.getElementById('btnCopyVanillaIp');

    btnCopyLocalIp?.addEventListener('click', () => {
        const text = dashboardLocalIp?.textContent?.trim();
        if (text) {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Address copied to clipboard!');
            }).catch(() => {
                showToast('Failed to copy address');
            });
        }
    });

    btnCopyVanillaIp?.addEventListener('click', () => {
        const text = dashboardVanillaIp?.textContent?.trim();
        if (text && text !== 'Offline') {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Address copied to clipboard!');
            }).catch(() => {
                showToast('Failed to copy address');
            });
        }
    });

    btnCopyPublicIp?.addEventListener('click', () => {
        const text = dashboardPublicIp?.textContent?.trim();
        if (text && text !== 'Offline' && text !== 'Upgrade to Pro') {
            navigator.clipboard.writeText(text).then(() => {
                showToast('Direct address copied to clipboard!');
            }).catch(() => {
                showToast('Failed to copy address');
            });
        }
    });

    // Upgraded Console Controls
    const consoleSearchInput = document.getElementById('consoleSearchInput');
    const chkAutoScroll = document.getElementById('chkAutoScroll');
    const btnClearConsole = document.getElementById('btnClearConsole');
    const consoleLineCountBadge = document.getElementById('consoleLineCountBadge');

    function updateStatusUI(st, info = null) {
        const formatted = st.charAt(0).toUpperCase() + st.slice(1);
        
        if (statusBadge && statusText) {
            statusBadge.className = `status-badge ${st}`;
            statusText.textContent = formatted;
        }

        if (sidebarStatusBadge) {
            sidebarStatusBadge.className = `status-badge ${st}`;
            sidebarStatusBadge.title = `Status: ${formatted}`;
            if (sidebarStatusText) sidebarStatusText.textContent = formatted;
        }

        if (info && info.loader && info.version) {
            const formattedLoader = info.loader.charAt(0).toUpperCase() + info.loader.slice(1);
            if (sidebarPackInfo) sidebarPackInfo.textContent = `${formattedLoader} ${info.version}`;
            if (dashboardMcVersion) dashboardMcVersion.textContent = info.version;
            if (dashboardLoader) dashboardLoader.textContent = formattedLoader;
            if (dashboardPackName && info.pack_name) dashboardPackName.textContent = info.pack_name;
        }

        // Address / Tunnel info update
        if (tunnelStatusBadge) {
            if (info && info.tunnel && info.tunnel.active && info.tunnel.public_address) {
                if (dashboardVanillaIp) dashboardVanillaIp.textContent = info.tunnel.vanilla_address || 'eloi.minenager.net';
                tunnelStatusBadge.textContent = 'Online';
                tunnelStatusBadge.style.background = '#065f46';
                tunnelStatusBadge.style.color = '#34d399';
            } else if (info && info.tunnel && info.tunnel.error) {
                if (dashboardVanillaIp) dashboardVanillaIp.textContent = 'Error';
                tunnelStatusBadge.textContent = 'Error';
                tunnelStatusBadge.style.background = '#7f1d1d';
                tunnelStatusBadge.style.color = '#f87171';
            } else {
                const port = (info && info.port) || 25565;
                if (dashboardVanillaIp) dashboardVanillaIp.textContent = `localhost:${port}`;
                tunnelStatusBadge.textContent = 'Local';
                tunnelStatusBadge.style.background = '#27272a';
                tunnelStatusBadge.style.color = '#a1a1aa';
            }
        }

        if (mobileStatusBadge) {
            mobileStatusBadge.className = `status-badge ${st}`;
        }

        const isOffline = (st === 'offline');
        const isStopping = (st === 'stopping');

        if (btnStart) btnStart.disabled = !isOffline;
        if (btnStop) btnStop.disabled = (isOffline || isStopping);
        if (btnRestart) btnRestart.disabled = (isOffline || isStopping);
    }

    function renderAllLogs() {
        if (!consoleOutput) return;
        const query = (consoleSearchInput?.value || '').toLowerCase().trim();

        consoleOutput.innerHTML = '';
        const filtered = rawLogs.filter(log => {
            if (!query) return true;
            return (log.text || '').toLowerCase().includes(query) || (log.timestamp || '').toLowerCase().includes(query);
        });

        if (consoleLineCountBadge) {
            consoleLineCountBadge.textContent = `${filtered.length} lines`;
        }

        if (filtered.length === 0) {
            consoleOutput.innerHTML = `<div class="log-line" style="color: var(--text-muted); font-style: italic;">${query ? 'No log lines match filter.' : 'Console buffer empty.'}</div>`;
            return;
        }

        filtered.forEach(log => {
            const line = document.createElement('div');
            line.className = 'log-line';
            
            let typeClass = 'log-info';
            const txt = log.text || '';
            if (txt.includes('/WARN') || txt.includes('WARN]')) typeClass = 'log-warn';
            else if (txt.includes('/ERROR') || txt.includes('ERROR]')) typeClass = 'log-error';
            else if (txt.startsWith('>')) typeClass = 'log-user';
            else if (txt.includes('Done (') || txt.includes('started')) typeClass = 'log-success';

            line.innerHTML = `<span class="log-time">[${escapeHtml(log.timestamp || '')}]</span> <span class="${typeClass}">${escapeHtml(txt)}</span>`;
            consoleOutput.appendChild(line);
        });

        if (chkAutoScroll?.checked) {
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    }

    function appendNewLogs(newLogs) {
        if (!newLogs || newLogs.length === 0) return;
        
        newLogs.forEach(l => {
            rawLogs.push(l);
            if (l.id && l.id > lastSeenLogId) {
                lastSeenLogId = l.id;
            }
        });

        // Retain last 500 lines in UI memory buffer without truncating stream cursor
        if (rawLogs.length > 500) {
            rawLogs = rawLogs.slice(rawLogs.length - 500);
        }

        renderAllLogs();
    }

    async function pollServerStatusAndLogs() {
        try {
            // 1. Fetch live status & metadata
            const statusRes = await fetch('/api/server/status');
            const statusData = await statusRes.json();
            const st = statusData.status || 'offline';
            updateStatusUI(st, statusData);

            // 2. Fetch incremental live logs using last seen log ID
            const url = lastSeenLogId > 0 
                ? `/api/server/logs?after_id=${lastSeenLogId}` 
                : `/api/server/logs?start_index=0`;

            const logsRes = await fetch(url);
            const logsData = await logsRes.json();
            const newLogs = logsData.logs || [];
            
            if (newLogs.length > 0) {
                appendNewLogs(newLogs);
            }
            if (logsData.latest_id && logsData.latest_id > lastSeenLogId) {
                lastSeenLogId = logsData.latest_id;
            }
        } catch (err) {
            console.error('Error polling server status/logs:', err);
        }
    }

    // Dynamic responsive poller (2.5s for live status and console updates)
    let pollInterval = setInterval(pollServerStatusAndLogs, 2500);
    pollServerStatusAndLogs();

    async function handleStart() {
        updateStatusUI('starting');
        try {
            const res = await fetch('/api/server/start', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to start server');
            showToast('Minecraft server launching...');
            pollServerStatusAndLogs();
        } catch (err) {
            alert(`Start error: ${err.message}`);
            pollServerStatusAndLogs();
        }
    }

    async function handleStop() {
        updateStatusUI('stopping');
        try {
            const res = await fetch('/api/server/stop', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to stop server');
            showToast('Minecraft server stopping...');
            pollServerStatusAndLogs();
        } catch (err) {
            alert(`Stop error: ${err.message}`);
            pollServerStatusAndLogs();
        }
    }

    async function handleRestart() {
        updateStatusUI('starting');
        try {
            const res = await fetch('/api/server/restart', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to restart server');
            showToast('Minecraft server restarting...');
            pollServerStatusAndLogs();
        } catch (err) {
            alert(`Restart error: ${err.message}`);
            pollServerStatusAndLogs();
        }
    }

    btnStart?.addEventListener('click', handleStart);
    btnStop?.addEventListener('click', handleStop);
    btnRestart?.addEventListener('click', handleRestart);

    async function sendConsoleCommand(cmd) {
        if (!cmd || !cmd.trim()) return;
        const cleanCmd = cmd.trim();

        // Add to history
        commandHistory.push(cleanCmd);
        historyIndex = commandHistory.length;

        try {
            const res = await fetch('/api/server/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cleanCmd })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to send command');
            pollServerStatusAndLogs();
        } catch (err) {
            alert(`Command error: ${err.message}`);
        }
    }

    commandForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const cmd = commandInput?.value;
        if (cmd) {
            sendConsoleCommand(cmd);
            commandInput.value = '';
        }
    });

    // Command history navigation with Up/Down arrows
    commandInput?.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
            if (commandHistory.length > 0 && historyIndex > 0) {
                historyIndex--;
                commandInput.value = commandHistory[historyIndex];
                e.preventDefault();
            }
        } else if (e.key === 'ArrowDown') {
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                commandInput.value = commandHistory[historyIndex];
                e.preventDefault();
            } else {
                historyIndex = commandHistory.length;
                commandInput.value = '';
            }
        }
    });

    // Quick Command Chips
    document.querySelectorAll('.chip-btn[data-cmd]').forEach(chip => {
        chip.addEventListener('click', () => {
            const cmd = chip.getAttribute('data-cmd');
            if (commandInput) {
                commandInput.value = cmd;
                commandInput.focus();
            }
        });
    });

    // Search filter in console
    consoleSearchInput?.addEventListener('input', () => {
        renderAllLogs();
    });

    // Clear console buffer
    btnClearConsole?.addEventListener('click', () => {
        rawLogs = [];
        renderAllLogs();
        showToast('Console buffer cleared');
    });

    // Toggle console expanded height
    const btnToggleConsoleHeight = document.getElementById('btnToggleConsoleHeight');
    btnToggleConsoleHeight?.addEventListener('click', () => {
        if (!consoleOutput) return;
        const isExpanded = consoleOutput.classList.toggle('expanded');
        btnToggleConsoleHeight.textContent = isExpanded ? 'Collapse' : 'Expand';
        if (chkAutoScroll?.checked) {
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    });
}
