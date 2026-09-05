# ⛏️ Minenager

**Minenager** (Minecraft Server Manager) is a lightweight, zero-bloat web dashboard designed to make hosting and managing Minecraft servers effortless on low-spec hardware.

Built with **FastAPI**, **Docker**, and modern vanilla JavaScript & CSS with no heavy frontend frameworks.

---

## ✨ Features

- 🚀 **1-Click Software & Version Installer**: Easily install Vanilla, Fabric, or Quilt across versions with automatic loader resolution and EULA handling.
- 💬 **Discord Bot & Remote Control**: Manage your server directly from Discord (`!turnon`, `!turnoff`, `!restart`, `!status`, `!players`, `!cmd`) with automated game event broadcasts (server start/stop, player joins/leaves with avatars, crash alerts).
- 📦 **Modrinth Integration**:
  - Search and install mods directly from Modrinth with loader & version auto-filtering.
  - Import `.mrpack` modpacks with automatic file extraction and dependency resolution.
- 👥 **Visual Player Management**: View online players with avatars (Minotar), kick, ban, whitelist, or promote to OP with a single click.
- 💻 **Real-time Web Console**: Live log streaming with colorized output and an interactive command input box.
- ⚙️ **Simplified Server Settings**: Adjust RAM allocation, gamemode, difficulty, max players (1–10), view distance, simulation distance, and MOTD.
- 🔌 **Auto-Start on Boot**: Optional toggle to launch the Minecraft server automatically when the Docker container boots on host PC power-on.
- 💾 **1-Click Backups & Storage Optimizer**: Quick world backups, download/restore points, and a 1-click log & crash report cleaner to save disk space on small hosts.

---

## ⚡ Lightweight Resource Footprint

Minenager is built specifically for low-spec and older hardware:

| Component | RAM Usage (Idle) | CPU Usage (Idle) |
| :--- | :--- | :--- |
| **Web Dashboard & API** | **~95 MB** | **< 1.0%** |
| **Vanilla Frontend** | **0 MB** (Zero client bundles/node_modules) | **0%** |

*Minecraft server RAM is separately configurable (1 GB to 16 GB) directly from the Settings tab.*

---

## 🖥️ Host PC Boot Policy & Auto-Start

Minenager is configured out-of-the-box with `restart: unless-stopped` in `docker-compose.yml`:
1. **Host PC Startup**: When your server PC powers on or restarts, Docker automatically boots the Minenager container in the background.
2. **Dashboard-Only vs. Minecraft Server Auto-Start**:
   - **Default (Off)**: Only the lightweight web dashboard runs (~95 MB RAM), waiting for you to press **Start** when you're ready to play.
   - **Auto-Start Enabled**: If you enable **Auto-Start on Boot** under the **Settings** tab, Minenager will also immediately launch your Minecraft server upon container boot.

---

## 🛠️ Quick Start

### 1. Requirements
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)

### 2. Run with Docker Compose
Clone the repository and launch the container:

```bash
git clone https://github.com/pontro/minenager.git
cd minenager
docker compose up -d
```

### 3. Access Dashboard
- **Web Dashboard**: Open [http://localhost:3000](http://localhost:3000)
- **Minecraft Server Port**: `25565`

---

## 💬 Discord Bot Setup & Remote Control

Minenager includes a built-in asynchronous Discord bot that connects directly via Discord Gateway v10 with zero additional dependencies.

### 1. Create Your Discord Bot (2 Minutes)
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application** (e.g. *Minenager*).
2. Go to the **Bot** tab:
   - Click **Reset Token** (or **Copy Token**) and save your **Bot Token**.
   - Scroll down to **Privileged Gateway Intents** and enable **Message Content Intent** (required for the bot to read `!commands`).
3. Go to **OAuth2 ➔ URL Generator**:
   - Under **Scopes**, check `bot`.
   - Under **Bot Permissions**, check:
     - `Send Messages`
     - `Embed Links`
     - `Read Message History`
   - Copy the generated URL, open it in your browser, and invite the bot into your Discord server.

### 2. Configure in Minenager
1. Open Minenager at [http://localhost:3000](http://localhost:3000) and click the **💬 Discord Bot** tab.
2. Check **Enable Discord Bot**.
3. Paste your **Bot Token**.
4. In Discord, right-click the text channel where you want messages sent (e.g. `#minecraft-server`) ➔ **Copy Channel ID** and paste it into **Target Channel ID** *(Note: Enable Developer Mode in Discord Settings ➔ Advanced if you don't see Copy ID)*.
5. (Optional) Right-click your own profile or role in Discord ➔ **Copy ID** and paste into **Authorized Admin User IDs** / **Authorized Admin Role IDs**.
6. Click **💾 Save Discord Settings** and then **🧪 Send Test Message** to verify the bot is connected!

### 3. Discord Bot Commands

| Command | Permission | Description |
| :--- | :--- | :--- |
| `!status` | Public / Admin | Live server status embed (state, version, loader, RAM, online players). |
| `!players` | Public / Admin | Displays the list of online players with Minotar skin avatars. |
| `!turnon` | Admin Only | Starts the Minecraft server. |
| `!turnoff` | Admin Only | Cleanly saves world data and stops the Minecraft server. |
| `!restart` | Admin Only | Restarts the Minecraft server with a chat warning. |
| `!cmd <command>` | Admin Only | Executes any Minecraft console command (e.g. `!cmd time set day`, `!cmd weather clear`, `!cmd op Steve`). |
| `!help` | Public / Admin | Displays the commands cheat sheet and server controls. |

### 4. Automatic Event Broadcasts
When enabled in the Discord Bot tab, Minenager automatically broadcasts embeds for:
- 🟢 **Server Started**: Alerts when the Minecraft server is online and ready for connections.
- 🔴 **Server Stopped / Crashed**: Alerts when the server cleanly shuts down or terminates unexpectedly.
- 🚪 **Player Join / Leave**: Visual alerts displaying player avatars from Minotar when players join or disconnect.

---

## 📁 Project Structure

```
├── app/
│   ├── main.py              # FastAPI app & lifespan manager
│   ├── routers/             # API routes (server, installer, mods, mrpack, settings, players, storage)
│   ├── services/            # Core business logic & process managers
│   ├── templates/           # Modular Jinja2 HTML templates & tab views
│   └── static/              # CSS styles & modular ES JavaScript modules
├── Dockerfile               # Python 3.11 + OpenJDK headless container
├── docker-compose.yml       # Container orchestration
└── requirements.txt         # Lightweight Python dependencies
```

---

## 📄 License
MIT License. Open source and free for the community.
