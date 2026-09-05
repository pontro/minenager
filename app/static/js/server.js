// --- Live Server Process & Console Management ---
import { escapeHtml, showToast } from './utils.js';

let logStartIndex = 0;

export function initServerManager() {
    const consoleOutput = document.getElementById('consoleOutput');
    const commandForm = document.getElementById('commandForm');
    const commandInput = document.getElementById('commandInput');
    const btnStart = document.getElementById('btnStart');
    const btnStop = document.getElementById('btnStop');
    const btnRestart = document.getElementById('btnRestart');
    const statusBadge = document.getElementById('statusBadge');
    const statusText = document.getElementById('statusText');

    function renderLogLine(log) {
        const line = document.createElement('div');
        line.className = 'log-line';
        
        let typeClass = 'log-info';
        const txt = log.text || '';
        if (txt.includes('/WARN') || txt.includes('WARN]')) typeClass = 'log-warn';
        else if (txt.startsWith('>')) typeClass = 'log-user';

        line.innerHTML = `<span class="log-time">[${escapeHtml(log.timestamp)}]</span> <span class="${typeClass}">${escapeHtml(txt)}</span>`;

        if (consoleOutput) {
            consoleOutput.appendChild(line);
            consoleOutput.scrollTop = consoleOutput.scrollHeight;
        }
    }

    async function pollServerStatusAndLogs() {
        try {
            // 1. Fetch live status
            const statusRes = await fetch('/api/server/status');
            const statusData = await statusRes.json();
            const st = statusData.status || 'offline';

            if (statusBadge && statusText) {
                statusBadge.className = `status-badge ${st}`;
                statusText.textContent = st.charAt(0).toUpperCase() + st.slice(1);
            }

            if (btnStart) btnStart.disabled = (st !== 'offline');
            if (btnStop) btnStop.disabled = (st === 'offline' || st === 'stopping');
            if (btnRestart) btnRestart.disabled = (st === 'offline' || st === 'stopping');

            // 2. Fetch incremental live logs
            const logsRes = await fetch(`/api/server/logs?start_index=${logStartIndex}`);
            const logsData = await logsRes.json();
            const newLogs = logsData.logs || [];
            
            if (newLogs.length > 0) {
                newLogs.forEach(log => renderLogLine(log));
                logStartIndex = logsData.total_count || (logStartIndex + newLogs.length);
            }
        } catch (err) {
            console.error('Error polling server status/logs:', err);
        }
    }

    // 30s background poller
    setInterval(pollServerStatusAndLogs, 30000);
    pollServerStatusAndLogs();

    btnStart?.addEventListener('click', async () => {
        btnStart.disabled = true;
        if (statusBadge) {
            statusBadge.className = 'status-badge starting';
            statusText.textContent = 'Starting...';
        }
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
    });

    btnStop?.addEventListener('click', async () => {
        btnStop.disabled = true;
        if (statusBadge) {
            statusBadge.className = 'status-badge starting';
            statusText.textContent = 'Stopping...';
        }
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
    });

    btnRestart?.addEventListener('click', async () => {
        btnStop.disabled = true;
        btnRestart.disabled = true;
        if (statusBadge) {
            statusBadge.className = 'status-badge starting';
            statusText.textContent = 'Restarting...';
        }
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
    });

    async function sendConsoleCommand(cmd) {
        if (!cmd || !cmd.trim()) return;
        try {
            const res = await fetch('/api/server/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command: cmd.trim() })
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
}
