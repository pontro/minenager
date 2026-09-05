// --- Performance & Metrics Live Monitoring ---
import { formatBytes } from './utils.js';

let metricsPollingTimer = null;
let isTabActive = false;
let historyBuffer = [];
const MAX_HISTORY_POINTS = 30;

export function initMetricsManager() {
    const metricsLiveBadge = document.getElementById('metricsLiveBadge');
    const metricsUptimeText = document.getElementById('metricsUptimeText');
    const btnRefreshMetrics = document.getElementById('btnRefreshMetrics');

    // TPS elements
    const metricTpsBadge = document.getElementById('metricTpsBadge');
    const metricTpsVal = document.getElementById('metricTpsVal');
    const metricMsptVal = document.getElementById('metricMsptVal');
    const metricTpsBar = document.getElementById('metricTpsBar');
    const metricTpsStatusText = document.getElementById('metricTpsStatusText');

    // CPU elements
    const metricCpuBadge = document.getElementById('metricCpuBadge');
    const metricSysCpuVal = document.getElementById('metricSysCpuVal');
    const metricProcCpuVal = document.getElementById('metricProcCpuVal');
    const metricCpuCores = document.getElementById('metricCpuCores');
    const metricCpuBar = document.getElementById('metricCpuBar');
    const metricLoadAvgText = document.getElementById('metricLoadAvgText');

    // RAM elements
    const metricRamBadge = document.getElementById('metricRamBadge');
    const metricProcRamVal = document.getElementById('metricProcRamVal');
    const metricMaxRamVal = document.getElementById('metricMaxRamVal');
    const metricSysRamVal = document.getElementById('metricSysRamVal');
    const metricRamBar = document.getElementById('metricRamBar');
    const metricRamFooter = document.getElementById('metricRamFooter');

    // Process elements
    const metricPidBadge = document.getElementById('metricPidBadge');
    const metricThreadsVal = document.getElementById('metricThreadsVal');
    const metricThreadsBar = document.getElementById('metricThreadsBar');
    const metricServerStatusText = document.getElementById('metricServerStatusText');

    // Canvases
    const cpuCanvas = document.getElementById('cpuChartCanvas');
    const ramCanvas = document.getElementById('ramChartCanvas');
    const chartCpuLatest = document.getElementById('chartCpuLatest');
    const chartRamLatest = document.getElementById('chartRamLatest');

    // Setup high-DPI canvas
    function setupCanvas(canvas) {
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const width = rect.width || 500;
        const height = 140;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        return { ctx, width, height };
    }

    function drawChart(canvas, seriesList, maxValue = 100, unit = '%') {
        if (!canvas || historyBuffer.length < 2) return;
        const setup = setupCanvas(canvas);
        if (!setup) return;
        const { ctx, width, height } = setup;

        const padding = { top: 12, right: 12, bottom: 20, left: 35 };
        const chartW = width - padding.left - padding.right;
        const chartH = height - padding.top - padding.bottom;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Draw horizontal grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.lineWidth = 1;
        ctx.fillStyle = 'rgba(156, 163, 175, 0.7)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';

        const gridSteps = 3;
        for (let i = 0; i <= gridSteps; i++) {
            const val = (maxValue / gridSteps) * i;
            const y = padding.top + chartH - (i / gridSteps) * chartH;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartW, y);
            ctx.stroke();

            const label = val >= 1000 ? `${(val / 1024).toFixed(1)}G` : `${Math.round(val)}${unit}`;
            ctx.fillText(label, padding.left - 6, y + 3);
        }

        const stepX = chartW / (MAX_HISTORY_POINTS - 1);
        const dataOffset = MAX_HISTORY_POINTS - historyBuffer.length;

        seriesList.forEach(series => {
            const points = historyBuffer.map((d, index) => {
                const x = padding.left + (dataOffset + index) * stepX;
                const rawVal = d[series.key] || 0;
                const normVal = Math.min(1.0, Math.max(0, rawVal / (maxValue || 1)));
                const y = padding.top + chartH - (normVal * chartH);
                return { x, y, rawVal };
            });

            if (points.length === 0) return;

            // Draw Area Fill
            const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
            gradient.addColorStop(0, series.fillColorTop || 'rgba(56, 189, 248, 0.3)');
            gradient.addColorStop(1, series.fillColorBottom || 'rgba(56, 189, 248, 0.0)');

            ctx.beginPath();
            ctx.moveTo(points[0].x, padding.top + chartH);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            // Draw Stroke Line
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            points.forEach(p => ctx.lineTo(p.x, p.y));
            ctx.strokeStyle = series.strokeColor || '#38bdf8';
            ctx.lineWidth = 2;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();

            // Draw latest pulse dot
            const lastP = points[points.length - 1];
            ctx.beginPath();
            ctx.arc(lastP.x, lastP.y, 3.5, 0, Math.PI * 2);
            ctx.fillStyle = series.strokeColor;
            ctx.fill();
        });
    }

    async function fetchMetrics() {
        try {
            const res = await fetch('/api/metrics/live');
            if (!res.ok) return;
            const data = await res.json();

            // Append to rolling history
            historyBuffer.push({
                time: data.timestamp,
                sys_cpu: data.cpu.system_percent,
                proc_cpu: data.cpu.process_percent,
                proc_ram_mb: data.memory.process_rss_mb,
                sys_ram_mb: data.memory.system_used_mb,
                tps: data.tps.tps
            });

            if (historyBuffer.length > MAX_HISTORY_POINTS) {
                historyBuffer.shift();
            }

            // Update UI Gauges
            updateUI(data);

            // Redraw Charts
            renderCharts(data);

        } catch (err) {
            console.error('Error fetching live metrics:', err);
        }
    }

    function updateUI(data) {
        if (metricsUptimeText) {
            metricsUptimeText.textContent = data.host.uptime_formatted;
        }

        // 1. TPS & Tick
        const tps = data.tps.tps;
        const mspt = data.tps.mspt;
        if (metricTpsVal) metricTpsVal.innerHTML = `${tps.toFixed(1)} <span class="metric-unit">TPS</span>`;
        if (metricMsptVal) metricMsptVal.textContent = `${mspt.toFixed(1)} ms`;
        if (metricTpsBadge) {
            metricTpsBadge.textContent = `${tps.toFixed(1)} TPS`;
            metricTpsBadge.className = `status-badge ${tps >= 19.0 ? 'online' : tps >= 15.0 ? 'warning' : 'offline'}`;
        }
        if (metricTpsBar) {
            const tpsPct = Math.min(100, Math.max(0, (tps / 20.0) * 100));
            metricTpsBar.style.width = `${tpsPct}%`;
            metricTpsBar.className = `progress-bar-fill ${tps >= 19.0 ? 'fill-online' : tps >= 15.0 ? 'fill-warning' : 'fill-danger'}`;
        }
        if (metricTpsStatusText) {
            const icon = tps >= 19.0 ? '🟢' : tps >= 15.0 ? '🟡' : '🔴';
            metricTpsStatusText.textContent = `${icon} ${data.tps.status} (budget: 50.0ms)`;
        }

        // 2. CPU
        const sysCpu = data.cpu.system_percent;
        const procCpu = data.cpu.process_percent;
        if (metricSysCpuVal) metricSysCpuVal.innerHTML = `${sysCpu.toFixed(1)}<span class="metric-unit">%</span>`;
        if (metricProcCpuVal) metricProcCpuVal.textContent = `${procCpu.toFixed(1)}%`;
        if (metricCpuCores) metricCpuCores.textContent = `(${data.cpu.num_cpus} CPU cores)`;
        if (metricCpuBadge) {
            metricCpuBadge.textContent = `${sysCpu.toFixed(1)}%`;
            metricCpuBadge.className = `status-badge ${sysCpu < 70 ? 'online' : sysCpu < 90 ? 'warning' : 'offline'}`;
        }
        if (metricCpuBar) {
            metricCpuBar.style.width = `${Math.min(100, sysCpu)}%`;
        }
        if (metricLoadAvgText) {
            const loads = data.cpu.load_avg.join(', ');
            metricLoadAvgText.textContent = `Load Average (1m, 5m, 15m): ${loads}`;
        }

        // 3. RAM
        const rssFormatted = data.memory.process_rss_formatted;
        const maxGb = data.memory.max_ram_gb;
        const procPct = data.memory.process_percent;
        if (metricProcRamVal) metricProcRamVal.innerHTML = `${rssFormatted}`;
        if (metricMaxRamVal) metricMaxRamVal.textContent = `${maxGb} GB`;
        if (metricSysRamVal) metricSysRamVal.textContent = `${data.memory.system_used_formatted} / ${data.memory.system_total_formatted}`;
        if (metricRamBadge) {
            metricRamBadge.textContent = rssFormatted;
        }
        if (metricRamBar) {
            metricRamBar.style.width = `${Math.min(100, procPct)}%`;
        }
        if (metricRamFooter) {
            metricRamFooter.textContent = `Host RAM Total: ${data.memory.system_total_formatted} (${data.memory.system_percent}% used)`;
        }

        // 4. Process & Threads
        const isOnline = data.server_status === 'online';
        if (metricPidBadge) {
            metricPidBadge.textContent = data.host.pid ? `PID: ${data.host.pid}` : 'Offline';
            metricPidBadge.className = `status-badge ${isOnline ? 'online' : 'offline'}`;
        }
        if (metricThreadsVal) {
            metricThreadsVal.innerHTML = `${data.host.threads} <span class="metric-unit">threads</span>`;
        }
        if (metricThreadsBar) {
            const threadPct = Math.min(100, (data.host.threads / 60) * 100);
            metricThreadsBar.style.width = `${Math.max(5, threadPct)}%`;
        }
        if (metricServerStatusText) {
            metricServerStatusText.textContent = isOnline ? 'Online (Active)' : data.server_status === 'starting' ? 'Starting...' : 'Offline';
        }
    }

    function renderCharts(data) {
        // CPU Chart (System + Process)
        if (cpuCanvas) {
            drawChart(cpuCanvas, [
                {
                    key: 'sys_cpu',
                    strokeColor: '#38bdf8',
                    fillColorTop: 'rgba(56, 189, 248, 0.25)',
                    fillColorBottom: 'rgba(56, 189, 248, 0.0)'
                },
                {
                    key: 'proc_cpu',
                    strokeColor: '#22c55e',
                    fillColorTop: 'rgba(34, 197, 94, 0.25)',
                    fillColorBottom: 'rgba(34, 197, 94, 0.0)'
                }
            ], 100, '%');

            if (chartCpuLatest) {
                chartCpuLatest.textContent = `System: ${data.cpu.system_percent.toFixed(1)}% | Java: ${data.cpu.process_percent.toFixed(1)}%`;
            }
        }

        // RAM Chart (Process RSS)
        if (ramCanvas) {
            const maxMemLimitMb = (data.memory.max_ram_gb || 4) * 1024;
            drawChart(ramCanvas, [
                {
                    key: 'proc_ram_mb',
                    strokeColor: '#a855f7',
                    fillColorTop: 'rgba(168, 85, 247, 0.25)',
                    fillColorBottom: 'rgba(168, 85, 247, 0.0)'
                }
            ], maxMemLimitMb, 'M');

            if (chartRamLatest) {
                chartRamLatest.textContent = `Allocated: ${data.memory.process_rss_formatted} / ${data.memory.max_ram_gb} GB`;
            }
        }
    }

    async function loadHistory() {
        try {
            const res = await fetch('/api/metrics/history');
            if (!res.ok) return;
            const data = await res.json();
            if (Array.isArray(data.history) && data.history.length > 0) {
                historyBuffer = data.history;
            }
        } catch (err) {
            console.error('Error fetching initial metrics history:', err);
        }
    }

    function startPolling() {
        if (metricsPollingTimer) clearInterval(metricsPollingTimer);
        fetchMetrics();
        metricsPollingTimer = setInterval(fetchMetrics, 2000);
    }

    function stopPolling() {
        if (metricsPollingTimer) {
            clearInterval(metricsPollingTimer);
            metricsPollingTimer = null;
        }
    }

    function onTabActivated() {
        isTabActive = true;
        loadHistory().then(() => {
            startPolling();
        });
    }

    function onTabDeactivated() {
        isTabActive = false;
        stopPolling();
    }

    btnRefreshMetrics?.addEventListener('click', () => {
        fetchMetrics();
    });

    window.addEventListener('resize', () => {
        if (isTabActive && historyBuffer.length > 0) {
            fetchMetrics();
        }
    });

    return { onTabActivated, onTabDeactivated, fetchMetrics };
}
