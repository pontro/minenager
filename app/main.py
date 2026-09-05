from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from app.routers import mods, mrpack, settings, installer, process, backup, players, storage
from app.services import modrinth, mrpack as mrpack_service, settings as settings_service, backup as backup_service
from app.services.server_process import server_manager

app = FastAPI(title="Minenager")

app.mount("/static", StaticFiles(directory="app/static"), name="static")

templates = Jinja2Templates(directory="app/templates")

app.include_router(mods.router)
app.include_router(mrpack.router)
app.include_router(settings.router)
app.include_router(installer.router)
app.include_router(process.router)
app.include_router(backup.router)
app.include_router(players.router)
app.include_router(storage.router)

@app.get("/")
async def index(request: Request):
    instance = mrpack_service.get_current_instance()
    all_settings = settings_service.get_all_settings()
    props = all_settings["properties"]
    live_status = server_manager.get_status()["status"]
    
    current_version = instance["minecraft_version"] if instance else "1.20.1"
    current_loader = instance["loader"].capitalize() if instance else "Fabric"
    current_name = instance["name"] if instance else "Custom Server"

    server_info = {
        "status": live_status,
        "version": current_version,
        "loader": current_loader,
        "pack_name": current_name,
        "ram": f"{all_settings['ram_gb']} GB",
        "players_online": 0,
        "max_players": props.get("max-players", "10"),
        "port": 25565
    }
    
    all_versions = modrinth.get_minecraft_versions()
    if current_version not in all_versions:
        all_versions.insert(0, current_version)

    loaders = modrinth.get_loaders()
    backups = backup_service.list_backups()

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "title": "Minenager - Minecraft Server Manager",
            "server": server_info,
            "mc_versions": all_versions,
            "loaders": loaders,
            "instance": instance,
            "settings": all_settings,
            "backups": backups
        }
    )
