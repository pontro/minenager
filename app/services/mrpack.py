import os
import io
import json
import zipfile
import urllib.request
from pathlib import Path
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.services import downloader

USER_AGENT = "Minenager/1.0"
MINECRAFT_DIR = Path("/data/minecraft")

def _download_file(url: str, dest_path: Path):
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=45) as resp, open(dest_path, "wb") as out_file:
        out_file.write(resp.read())

def inspect_mrpack(zip_file: zipfile.ZipFile) -> Dict[str, Any]:
    """Read and validate modrinth.index.json inside .mrpack."""
    if "modrinth.index.json" not in zip_file.namelist():
        raise ValueError("Invalid .mrpack archive: missing modrinth.index.json")

    with zip_file.open("modrinth.index.json") as f:
        index_data = json.load(f)

    deps = index_data.get("dependencies", {})
    mc_version = deps.get("minecraft", "Unknown")

    # Determine loader and loader version
    loader = "fabric"
    loader_version = None
    for key in ["fabric-loader", "fabric", "forge", "neoforge", "quilt-loader", "quilt"]:
        if key in deps:
            loader = key.replace("-loader", "")
            loader_version = deps[key]
            break

    return {
        "name": index_data.get("name", "Modpack"),
        "summary": index_data.get("summary", ""),
        "version_id": index_data.get("versionId", ""),
        "minecraft_version": mc_version,
        "loader": loader,
        "loader_version": loader_version,
        "raw_index": index_data
    }

def install_mrpack(file_bytes: bytes) -> Dict[str, Any]:
    """Extract .mrpack, download server-compatible files, apply overrides, and download server.jar."""
    MINECRAFT_DIR.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(io.BytesIO(file_bytes)) as zf:
        metadata = inspect_mrpack(zf)
        index_data = metadata["raw_index"]
        files_list = index_data.get("files", [])
        mc_version = metadata["minecraft_version"]
        loader = metadata["loader"]
        loader_version = metadata["loader_version"]

        downloaded_count = 0
        skipped_client_count = 0
        failed_files = []

        # 1. Download indexed files (mods, libraries, etc.)
        for item in files_list:
            env = item.get("env", {})
            server_env = env.get("server", "required")

            # Skip client-only mods
            if server_env == "unsupported":
                skipped_client_count += 1
                continue

            rel_path = item.get("path")
            downloads = item.get("downloads", [])
            if not rel_path or not downloads:
                continue

            target_path = MINECRAFT_DIR / rel_path
            # Prevent directory traversal attacks
            if not str(target_path.resolve()).startswith(str(MINECRAFT_DIR.resolve())):
                continue

            downloaded = False
            for url in downloads:
                try:
                    _download_file(url, target_path)
                    downloaded = True
                    downloaded_count += 1
                    break
                except Exception as e:
                    print(f"Failed to download {url}: {e}")

            if not downloaded:
                failed_files.append(rel_path)

        # 2. Extract overrides
        overrides_count = 0
        for zip_info in zf.infolist():
            filename = zip_info.filename

            # Handle standard 'overrides/' and 'server-overrides/'
            target_subpath = None
            if filename.startswith("overrides/") and not filename.endswith("/"):
                target_subpath = filename[len("overrides/"):]
            elif filename.startswith("server-overrides/") and not filename.endswith("/"):
                target_subpath = filename[len("server-overrides/"):]

            if target_subpath:
                dest_file = MINECRAFT_DIR / target_subpath
                if not str(dest_file.resolve()).startswith(str(MINECRAFT_DIR.resolve())):
                    continue

                dest_file.parent.mkdir(parents=True, exist_ok=True)
                with zf.open(zip_info) as source, open(dest_file, "wb") as target:
                    target.write(source.read())
                overrides_count += 1

        # 3. Download the server loader jar (server.jar) for this version and loader
        server_jar_status = "Skipped"
        try:
            jar_res = downloader.download_server_loader_jar(
                mc_version=mc_version,
                loader=loader,
                loader_version=loader_version
            )
            server_jar_status = f"Downloaded {jar_res.get('jar_filename', 'server.jar')}"
        except Exception as e:
            print(f"Warning: Could not automatically download server jar: {e}")
            server_jar_status = f"Error: {e}"

        # 4. Save installation metadata
        instance_info = {
            "name": metadata["name"],
            "summary": metadata["summary"],
            "version_id": metadata["version_id"],
            "minecraft_version": mc_version,
            "loader": loader,
            "loader_version": loader_version,
            "server_jar": "server.jar",
            "installed_at": datetime.utcnow().isoformat(),
            "type": "mrpack"
        }

        instance_file = MINECRAFT_DIR / "instance.json"
        with open(instance_file, "w") as f:
            json.dump(instance_info, f, indent=2)

        return {
            "success": True,
            "name": metadata["name"],
            "minecraft_version": mc_version,
            "loader": loader,
            "loader_version": loader_version,
            "server_jar_status": server_jar_status,
            "downloaded_files": downloaded_count,
            "skipped_client_files": skipped_client_count,
            "overrides_extracted": overrides_count,
            "failed_files": failed_files
        }

def get_current_instance() -> Optional[Dict[str, Any]]:
    """Return installed instance metadata if present."""
    instance_file = MINECRAFT_DIR / "instance.json"
    if instance_file.exists():
        try:
            with open(instance_file, "r") as f:
                return json.load(f)
        except Exception:
            return None
    return None
