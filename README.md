# ⛏️ Minenager

**Minenager** (Minecraft Server Manager) is a lightweight, zero-bloat web dashboard designed to make hosting and managing Minecraft servers effortless on low-spec hardware.

Built with **FastAPI**, **Docker**, and modern vanilla JavaScript & CSS with no heavy frontend frameworks.

---

## ✨ Features

- 🚀 **1-Click Software & Version Installer**: Easily install Vanilla, Fabric, or Quilt across versions with automatic loader resolution and EULA handling.
- 📦 **Modrinth Integration**:
  - Search and install mods directly from Modrinth with loader & version auto-filtering.
  - Import `.mrpack` modpacks with automatic file extraction and dependency resolution.
- 👥 **Visual Player Management**: View online players with avatars (Minotar), kick, ban, whitelist, or promote to OP with a single click.
- 💻 **Real-time Web Console**: Live log streaming with colorized output and an interactive command input box.
- ⚙️ **Simplified Server Settings**: Adjust RAM allocation, gamemode, difficulty, max players (1–10), view distance, simulation distance, and MOTD.
- 💾 **1-Click Backups & Storage Optimizer**: Quick world backups, download/restore points, and a 1-click log & crash report cleaner to save disk space on small hosts.

---

## 🛠️ Quick Start

### 1. Requirements
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)

### 2. Run with Docker Compose
Clone the repository and launch the container:

```bash
git clone https://github.com/<your-username>/minenager.git
cd minenager
docker compose up -d
```

### 3. Access Dashboard
- **Web Dashboard**: Open [http://localhost:3000](http://localhost:3000)
- **Minecraft Server Port**: `25565`

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
