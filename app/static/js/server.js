// --- Live Server Process & Upgraded Console Management ---
import { escapeHtml, showToast } from './utils.js';

let logStartIndex = 0;
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

    // Sidebar controls
    const sidebarStatusBadge = document.getElementById('sidebarStatusBadge');
    const sidebarStatusText = document.getElementById('sidebarStatusText');
    const sidebarBtnStart = document.getElementById('sidebarBtnStart');
    const sidebarBtnStop = document.getElementById('sidebarBtnStop');
    const sidebarBtnRestart = document.getElementById('sidebarBtnRestart');
    const mobileStatusBadge = document.getElementById('mobileStatusBadge');

    // Upgraded Console Controls
    const consoleSearchInput = document.getElementById('consoleSearchInput');
    const chkAutoScroll = document.getElementById('chkAutoScroll');
    const btnClearConsole = document.getElementById('btnClearConsole');
    const consoleLineCountBadge = document.getElementById('consoleLineCountBadge');

    function updateStatusUI(st) {
        const formatted = st.charAt(0).toUpperCase() + st.slice(1);
        
        if (statusBadge && statusText) {
            statusBadge.className = `status-badge ${st}`;
            statusText.textContent = formatted;
        }

        if (sidebarStatusBadge && sidebarStatusText) {
            sidebarStatusBadge.className = `status-badge ${st}`;
            sidebarStatusText.textContent = formatted;
        }

        if (mobileStatusBadge) {
            mobileStatusBadge.className = `status-badge ${st}`;
        }

        const isOffline = (st === 'offline');
        const isStopping = (st === 'stopping');
        const isRunning = (!isOffline && !isStopping);

        if (btnStart) btnStart.disabled = !isOffline;
        if (btnStop) btnStop.disabled = (isOffline || isStopping);
        if (btnRestart) btnRestart.disabled = (isOffline || isStopping);

        if (sidebarBtnStart) sidebarBtnStart.disabled = !isOffline;
        if (sidebarBtnStop) sidebarBtnStop.disabled = (isOffline || isStopping);
        if (sidebarBtnRestart) sidebarBtnRestart.disabled = (isOffline || isStopping);
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
        newLogs.forEach(l => {
            rawLogs.push(l);
        });

        // Limit memory buffer to 300 entries
        if (rawLogs.length > 300) {
            rawLogs = rawLogs.slice(rawLogs.length - 300);
        }

        renderAllLogs();
    }

    async function pollServerStatusAndLogs() {
        try {
            // 1. Fetch live status
            const statusRes = await fetch('/api/server/status');
            const statusData = await statusRes.json();
            const st = statusData.status || 'offline';
            updateStatusUI(st);

            // 2. Fetch incremental live logs
            const logsRes = await fetch(`/api/server/logs?start_index=${logStartIndex}`);
            const logsData = await logsRes.json();
            const newLogs = logsData.logs || [];
            
            if (newLogs.length > 0) {
                appendNewLogs(newLogs);
                logStartIndex = logsData.total_count || (logStartIndex + newLogs.length);
            }
        } catch (err) {
            console.error('Error polling server status/logs:', err);
        }
    }

    // 30s background poller
    setInterval(pollServerStatusAndLogs, 30000);
    pollServerStatusAndLogs();

    async function handleStart() {
        updateStatusUI('starting');
        try {
            const res = await fetch('/api/server/start', { method: 'POST' });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'Failed to start server');
            showToast('🚀 Minecraft server launching...');
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
            showToast('⏹ Minecraft server stopping...');
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
            showToast('🔄 Minecraft server restarting...');
            pollServerStatusAndLogs();
        } catch (err) {
            alert(`Restart error: ${err.message}`);
            pollServerStatusAndLogs();
        }
    }

    btnStart?.addEventListener('click', handleStart);
    sidebarBtnStart?.addEventListener('click', handleStart);

    btnStop?.addEventListener('click', handleStop);
    sidebarBtnStop?.addEventListener('click', handleStop);

    btnRestart?.addEventListener('click', handleRestart);
    sidebarBtnRestart?.addEventListener('click', handleRestart);

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
}
