import json
import urllib.request
import urllib.error
from typing import Dict, Any, Optional
from app.core.config import settings

class DnsService:
    """
    Manages DNS SRV and CNAME records so Minecraft players connect via:
    <subdomain>.minenager.net without needing to type ports!
    (e.g., _minecraft._tcp.eloi.minenager.net -> target relay port 25567)
    """

    @staticmethod
    def sync_srv_record(subdomain: str, target_host: str, public_port: int) -> Dict[str, Any]:
        """
        Creates or updates Cloudflare DNS SRV record:
        _minecraft._tcp.<subdomain>.<TUNNEL_DOMAIN> -> port <public_port>, target <target_host>
        If no Cloudflare credentials are configured (e.g. dev), operates in simulated/mock mode.
        """
        srv_name = f"_minecraft._tcp.{subdomain}"
        vanilla_address = f"{subdomain}.{settings.TUNNEL_DOMAIN}"

        # Cloudflare SRV targets must be FQDNs (e.g. relay.minenager.net), not IP addresses or localhost
        is_ip_or_local = target_host in ["127.0.0.1", "localhost", "0.0.0.0"] or target_host.replace(".", "").isdigit()

        if not settings.CLOUDFLARE_API_TOKEN or not settings.CLOUDFLARE_ZONE_ID or is_ip_or_local:
            # Dev or self-hosted mode without Cloudflare API token or with IP relay host
            return {
                "configured": False,
                "vanilla_address": vanilla_address,
                "target_host": target_host,
                "target_port": public_port,
                "message": "Cloudflare credentials not set or target_host is local IP; SRV record simulated."
            }

        url = f"https://api.cloudflare.com/client/v4/zones/{settings.CLOUDFLARE_ZONE_ID}/dns_records"
        headers = {
            "Authorization": f"Bearer {settings.CLOUDFLARE_API_TOKEN}",
            "Content-Type": "application/json"
        }

        # Check existing SRV record
        try:
            req = urllib.request.Request(f"{url}?type=SRV&name={srv_name}.{settings.TUNNEL_DOMAIN}", headers=headers)
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                records = data.get("result", [])

            srv_data = {
                "type": "SRV",
                "name": srv_name,
                "data": {
                    "service": "_minecraft",
                    "proto": "_tcp",
                    "name": subdomain,
                    "priority": 0,
                    "weight": 5,
                    "port": public_port,
                    "target": target_host
                },
                "ttl": 120
            }

            if records:
                record_id = records[0]["id"]
                put_req = urllib.request.Request(
                    f"{url}/{record_id}",
                    data=json.dumps(srv_data).encode("utf-8"),
                    headers=headers,
                    method="PUT"
                )
                with urllib.request.urlopen(put_req, timeout=10) as put_resp:
                    return {"configured": True, "vanilla_address": vanilla_address, "action": "updated"}
            else:
                post_req = urllib.request.Request(
                    url,
                    data=json.dumps(srv_data).encode("utf-8"),
                    headers=headers,
                    method="POST"
                )
                with urllib.request.urlopen(post_req, timeout=10) as post_resp:
                    return {"configured": True, "vanilla_address": vanilla_address, "action": "created"}

        except Exception as e:
            print(f"[Minenager Cloud DNS] Error syncing SRV record: {e}")
            return {
                "configured": False,
                "vanilla_address": vanilla_address,
                "error": str(e)
            }

dns_service = DnsService()
