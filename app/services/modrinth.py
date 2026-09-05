import os
import json
import urllib.request
import urllib.parse
from pathlib import Path
from typing import List, Dict, Any, Optional, Set

MODRINTH_API = "https://api.modrinth.com/v2"
USER_AGENT = "Minenager/1.0"
MODS_DIR = Path("/data/minecraft/mods")

def _make_request(url: str) -> Any:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": USER_AGENT}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        if response.status == 200:
            return json.loads(response.read().decode('utf-8'))
        raise Exception(f"Modrinth API error: status {response.status}")

def _download_file(url: str, dest_path: Path):
    dest_path.parent.mkdir(parents=True, exist_ok=True)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=30) as resp, open(dest_path, "wb") as out_file:
        out_file.write(resp.read())

def get_minecraft_versions() -> List[str]:
    """Fetch all release game versions from Modrinth."""
    try:
        data = _make_request(f"{MODRINTH_API}/tag/game_version")
        # Filter for release versions, maintaining recent-first order
        releases = [v["version"] for v in data if v.get("version_type") == "release"]
        return releases
    except Exception as e:
        print(f"Error fetching MC versions: {e}")
        return ["1.21.4", "1.21.3", "1.21.1", "1.21.0", "1.20.4", "1.20.2", "1.20.1", "1.19.4", "1.18.2", "1.16.5"]

def get_loaders() -> List[str]:
    """Return supported mod loaders."""
    return ["fabric", "forge", "neoforge", "quilt"]

def search_mods(query: str = "", mc_version: Optional[str] = None, loader: Optional[str] = None, limit: int = 20) -> List[Dict[str, Any]]:
    """Search for mods on Modrinth strictly filtered by version, loader, and server compatibility."""
    facets = [["project_type:mod"]]
    if mc_version:
        facets.append([f"versions:{mc_version}"])
    if loader:
        facets.append([f"categories:{loader.lower()}"])

    params = {
        "limit": limit,
        "index": "downloads" if not query else "relevance",
        "facets": json.dumps(facets)
    }
    if query:
        params["query"] = query

    url = f"{MODRINTH_API}/search?{urllib.parse.urlencode(params)}"
    try:
        result = _make_request(url)
        hits = result.get("hits", [])
        # Only return mods that are supported on dedicated servers (exclude client-only mods)
        server_hits = [h for h in hits if h.get("server_side") != "unsupported"]
        return server_hits
    except Exception as e:
        print(f"Error searching mods: {e}")
        return []

def get_project_versions(project_id_or_slug: str, mc_version: Optional[str] = None, loader: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get compatible versions for a specific mod project."""
    params = {}
    if mc_version:
        params["game_versions"] = json.dumps([mc_version])
    if loader:
        params["loaders"] = json.dumps([loader.lower()])
    
    url = f"{MODRINTH_API}/project/{project_id_or_slug}/version"
    if params:
        url += f"?{urllib.parse.urlencode(params)}"
        
    try:
        return _make_request(url)
    except Exception as e:
        print(f"Error getting project versions: {e}")
        return []

def get_version_by_id(version_id: str) -> Optional[Dict[str, Any]]:
    """Fetch version details by direct version ID."""
    try:
        return _make_request(f"{MODRINTH_API}/version/{version_id}")
    except Exception as e:
        print(f"Error fetching version {version_id}: {e}")
        return None

def list_installed_mods() -> List[Dict[str, Any]]:
    """List all installed mod files from /data/minecraft/mods/."""
    MODS_DIR.mkdir(parents=True, exist_ok=True)
    installed = []
    
    for item in sorted(MODS_DIR.iterdir()):
        if item.is_file():
            is_enabled = item.name.endswith(".jar")
            is_disabled = item.name.endswith(".jar.disabled")
            if is_enabled or is_disabled:
                installed.append({
                    "filename": item.name,
                    "size_bytes": item.stat().st_size,
                    "enabled": is_enabled
                })
    return installed

def install_mod(
    project_id_or_slug: str,
    mc_version: str,
    loader: str,
    downloaded_projects: Optional[Set[str]] = None
) -> Dict[str, Any]:
    """Download and install the best matching version of a mod AND its required dependencies."""
    MODS_DIR.mkdir(parents=True, exist_ok=True)
    if downloaded_projects is None:
        downloaded_projects = set()

    clean_id = project_id_or_slug.strip()
    if clean_id in downloaded_projects:
        return {"success": True, "message": "Already downloaded", "downloaded_files": []}

    versions = get_project_versions(clean_id, mc_version=mc_version, loader=loader)
    if not versions:
        raise Exception(f"No compatible version found for '{clean_id}' on {loader} {mc_version}")

    # Use the latest compatible release/version
    target_version = versions[0]
    files = target_version.get("files", [])
    if not files:
        raise Exception(f"No downloadable files found for {clean_id} version {target_version.get('version_number')}.")

    primary_file = next((f for f in files if f.get("primary")), files[0])
    download_url = primary_file["url"]
    filename = primary_file["filename"]
    dest_path = MODS_DIR / filename

    # Download mod jar
    _download_file(download_url, dest_path)
    downloaded_projects.add(clean_id)
    if target_version.get("project_id"):
        downloaded_projects.add(target_version["project_id"])

    downloaded_files = [filename]

    # Auto-resolve and download all required dependencies (e.g. Fabric API, Architectury, Cloth Config, XaeroLib, etc.)
    dependencies = target_version.get("dependencies", [])
    for dep in dependencies:
        dep_type = dep.get("dependency_type")
        if dep_type != "required":
            continue

        dep_version_id = dep.get("version_id")
        dep_project_id = dep.get("project_id")

        if dep_project_id and dep_project_id in downloaded_projects:
            continue

        try:
            if dep_version_id:
                dep_ver_data = get_version_by_id(dep_version_id)
                if dep_ver_data and dep_ver_data.get("files"):
                    dep_files = dep_ver_data["files"]
                    dep_primary = next((f for f in dep_files if f.get("primary")), dep_files[0])
                    dep_dest = MODS_DIR / dep_primary["filename"]
                    _download_file(dep_primary["url"], dep_dest)
                    downloaded_files.append(dep_primary["filename"])
                    if dep_project_id:
                        downloaded_projects.add(dep_project_id)

                    # Check transitive dependencies
                    for sub_dep in dep_ver_data.get("dependencies", []):
                        if sub_dep.get("dependency_type") == "required" and sub_dep.get("project_id"):
                            if sub_dep["project_id"] not in downloaded_projects:
                                sub_res = install_mod(sub_dep["project_id"], mc_version=mc_version, loader=loader, downloaded_projects=downloaded_projects)
                                downloaded_files.extend(sub_res.get("downloaded_files", []))
            elif dep_project_id:
                dep_res = install_mod(dep_project_id, mc_version=mc_version, loader=loader, downloaded_projects=downloaded_projects)
                downloaded_files.extend(dep_res.get("downloaded_files", []))
        except Exception as dep_err:
            print(f"Warning: Could not auto-install required dependency {dep_project_id or dep_version_id}: {dep_err}")

    return {
        "success": True,
        "filename": filename,
        "version_number": target_version.get("version_number"),
        "size": primary_file.get("size"),
        "downloaded_files": downloaded_files
    }

def uninstall_mod(filename: str) -> Dict[str, Any]:
    """Remove a mod jar from /data/minecraft/mods/."""
    clean_name = os.path.basename(filename)
    target = MODS_DIR / clean_name
    if target.exists() and target.is_file():
        target.unlink()
        return {"success": True, "message": f"Deleted {clean_name}"}
    raise Exception("Mod file not found.")

def toggle_mod(filename: str) -> Dict[str, Any]:
    """Enable or disable a mod by renaming .jar <-> .jar.disabled."""
    clean_name = os.path.basename(filename)
    target = MODS_DIR / clean_name
    if not target.exists():
        raise Exception("Mod file not found.")

    if clean_name.endswith(".jar"):
        new_name = clean_name + ".disabled"
    elif clean_name.endswith(".jar.disabled"):
        new_name = clean_name[:-9]
    else:
        raise Exception("Invalid mod file extension.")

    new_path = MODS_DIR / new_name
    target.rename(new_path)
    return {"success": True, "new_filename": new_name}
