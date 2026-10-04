from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.database import get_db

router = APIRouter(tags=["admin"])

@router.get("/admin/db", response_class=HTMLResponse)
async def view_database(db: AsyncSession = Depends(get_db)):
    # Fetch all users
    users_res = await db.execute(text("SELECT id, username, email, tier, is_active, created_at FROM users ORDER BY created_at DESC;"))
    users = users_res.fetchall()

    # Fetch all tunnels
    tunnels_res = await db.execute(text("SELECT id, user_id, subdomain, public_port, is_online, last_heartbeat FROM tunnels ORDER BY created_at DESC;"))
    tunnels = tunnels_res.fetchall()

    # Fetch all subscriptions
    subs_res = await db.execute(text("SELECT id, user_id, status, plan_type, license_key, current_period_end FROM subscriptions ORDER BY created_at DESC;"))
    subs = subs_res.fetchall()

    # Generate lightweight HTML
    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Minenager Cloud DB Explorer</title>
        <style>
            :root {{
                --bg: #09090b;
                --card: #18181b;
                --border: #27272a;
                --text: #f4f4f5;
                --muted: #a1a1aa;
                --primary: #38bdf8;
                --pro: #fbbf24;
                --free: #71717a;
            }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace;
                background-color: var(--bg);
                color: var(--text);
                margin: 0;
                padding: 2rem;
            }}
            .header {{
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 2rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border);
            }}
            .title {{
                font-size: 1.3rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }}
            .badge-live {{
                background: rgba(16, 185, 129, 0.15);
                color: #34d399;
                border: 1px solid rgba(16, 185, 129, 0.3);
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 700;
            }}
            .card {{
                background: var(--card);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1.25rem;
                margin-bottom: 2rem;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            }}
            .card-title {{
                font-size: 1rem;
                font-weight: 600;
                margin-top: 0;
                margin-bottom: 1rem;
                color: var(--primary);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                font-size: 0.82rem;
                text-align: left;
            }}
            th {{
                color: var(--muted);
                padding: 0.6rem 0.8rem;
                border-bottom: 1px solid var(--border);
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                font-size: 0.72rem;
            }}
            td {{
                padding: 0.65rem 0.8rem;
                border-bottom: 1px solid #202023;
                word-break: break-all;
            }}
            tr:hover td {{
                background: rgba(255, 255, 255, 0.02);
            }}
            .pill {{
                padding: 0.15rem 0.45rem;
                border-radius: 4px;
                font-size: 0.7rem;
                font-weight: 700;
                display: inline-block;
            }}
            .pill-pro {{
                background: #3b2a05;
                color: #fbbf24;
                border: 1px solid #d97706;
            }}
            .pill-free {{
                background: #27272a;
                color: #a1a1aa;
                border: 1px solid #3f3f46;
            }}
            .btn-refresh {{
                background: #27272a;
                color: var(--text);
                border: 1px solid var(--border);
                padding: 0.4rem 0.8rem;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.8rem;
                text-decoration: none;
            }}
            .btn-refresh:hover {{
                background: #3f3f46;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">
                <span>🗄️ Minenager Cloud Database Explorer</span>
                <span class="badge-live">PostgreSQL 16 Live</span>
            </div>
            <a href="/admin/db" class="btn-refresh">↻ Refresh Data</a>
        </div>

        <!-- USERS TABLE -->
        <div class="card">
            <div class="card-title">
                <span>👥 Table: users ({len(users)})</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>UUID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Tier</th>
                        <th>Active</th>
                        <th>Registered</th>
                    </tr>
                </thead>
                <tbody>
    """

    for u in users:
        tier_class = "pill-pro" if u.tier == "pro" else "pill-free"
        html += f"""
                    <tr>
                        <td style="font-family: monospace; color: var(--muted);">{u.id}</td>
                        <td><strong>{u.username}</strong></td>
                        <td>{u.email}</td>
                        <td><span class="pill {tier_class}">{u.tier.upper()}</span></td>
                        <td>{'<span style="color:#34d399">Yes</span>' if u.is_active else '<span style="color:#f87171">No</span>'}</td>
                        <td style="color: var(--muted);">{u.created_at.strftime('%Y-%m-%d %H:%M') if u.created_at else ''}</td>
                    </tr>
        """

    html += """
                </tbody>
            </table>
        </div>

        <!-- TUNNELS TABLE -->
        <div class="card">
            <div class="card-title">
                <span>🌐 Table: tunnels</span>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Tunnel UUID</th>
                        <th>User ID</th>
                        <th>Subdomain</th>
                        <th>Relay Port</th>
                        <th>Online</th>
                        <th>Last Heartbeat</th>
                    </tr>
                </thead>
                <tbody>
    """

    for t in tunnels:
        online_str = '<span style="color:#34d399">ONLINE</span>' if t.is_online else '<span style="color:#71717a">OFFLINE</span>'
        html += f"""
                    <tr>
                        <td style="font-family: monospace; color: var(--muted);">{t.id}</td>
                        <td style="font-family: monospace; color: var(--muted);">{t.user_id}</td>
                        <td><strong>{t.subdomain}.minenager.net</strong></td>
                        <td><code>{t.public_port}</code></td>
                        <td>{online_str}</td>
                        <td style="color: var(--muted);">{t.last_heartbeat or 'Never'}</td>
                    </tr>
        """

    html += """
                </tbody>
            </table>
        </div>
    </body>
    </html>
    """
    return html
