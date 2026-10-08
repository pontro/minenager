# ☁️ Minenager Cloud Backend

The central cloud infrastructure, licensing authority, and reverse tunnel relay for **Minenager**.

This service coordinates client authentication, Pro subscription lifecycle, zero-portforward game tunnels & remote web cockpit relays (powered by FRP), and database administration.

---

## 🏗️ Architecture & Services

The backend stack is managed via Docker Compose (`docker-compose.yml`):

1. **`api` (FastAPI / Uvicorn)**:
   - Exposes REST endpoints on port `8080` (mapped to internal port `8000`).
   - Handles JWT authentication (`/api/v1/auth/login`, `/api/v1/auth/register`).
   - Reverse tunnel orchestration & dynamic port allocation (`/api/v1/tunnels/config`).
   - Real-time tunnel telemetry & player heartbeats (`/api/v1/tunnels/status/{token}`).
   - Embedded database explorer UI at `/admin/db`.
2. **`relay` (FRP Server - `frps`)**:
   - Reverse proxy relay listening on control port `2333` (TCP/UDP).
   - Maps client-side tunnels to public multiplayer game ports (`25566-25568+`) and secure remote web cockpit endpoints (`https://<username>.minenager.net`).
3. **`postgres` (PostgreSQL 16 Alpine)**:
   - Stores users, sessions, subscription tiers (`free` vs `pro`), tunnels, and telemetry logs.

---

## 🚀 Quick Start

### 1. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```

Key environment variables:
| Variable | Default (Dev) | Description |
| :--- | :--- | :--- |
| `ENVIRONMENT` | `development` | When set to `development`, skips basic auth on `/admin/db`. In `production`, requires credentials. |
| `ADMIN_USERNAME` | `admin` | Admin dashboard username. |
| `ADMIN_PASSWORD` | `minenager_admin_password_2026!` | Admin dashboard password. |
| `TUNNEL_DOMAIN` | `minenager.net` | Domain suffix for zero-port SRV record resolution. |
| `STRIPE_SECRET_KEY` | *(empty)* | Stripe secret key for Pro plan subscriptions. |

### 2. Launch Services
```bash
docker compose up -d
```

### 3. Verify Health & Admin Explorer
- **Cloud API Docs**: [http://localhost:8080/docs](http://localhost:8080/docs)
- **Database Explorer UI**: [http://localhost:8080/admin/db](http://localhost:8080/admin/db)
- **PostgreSQL**: Port `5432` (`minenager` / `minenager_dev_password`)

---

## 🔒 Security & Admin UI
- In local development mode (`ENVIRONMENT=development`), `/admin/db` is immediately accessible for rapid database inspection.
- In production mode (`ENVIRONMENT=production`), HTTP Basic Auth is strictly enforced using `ADMIN_USERNAME` and `ADMIN_PASSWORD`.

---

## 📄 License
MIT License.

