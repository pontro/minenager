import { NextRequest, NextResponse } from "next/server";

interface ModItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  platform: string;
  serverSide: string;
  clientSide: string;
  categories: string[];
  downloads: number;
  iconUrl: string | null;
}

interface ModrinthSearchHit {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  client_side: string;
  server_side: string;
  project_type: string;
  downloads: number;
  icon_url: string | null;
}

interface ModrinthSearchResponse {
  hits: ModrinthSearchHit[];
  total_hits: number;
}

interface HangarProjectHit {
  name: string;
  namespace: {
    owner: string;
    slug: string;
  };
  description: string;
  avatarUrl?: string;
  stats: {
    downloads: number;
    stars: number;
  };
}

interface HangarSearchResponse {
  result: HangarProjectHit[];
  pagination: {
    count: number;
    limit: number;
    offset: number;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "";
  const loader = (searchParams.get("loader") || "fabric").toLowerCase();
  const version = searchParams.get("version") || "1.20.1";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 40);

  // If vanilla, return clean empty response
  if (loader === "vanilla") {
    return NextResponse.json({
      mods: [],
      total: 0,
      note: "Vanilla Minecraft runs without mod loaders. No mods required.",
    });
  }

  const resultsMap = new Map<string, ModItem>();
  const qLower = query.trim().toLowerCase();

  // Function to normalize a mod/plugin title for robust deduplication
  const getNormalizedKey = (name: string, slug: string) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    const cleanSlug = slug.toLowerCase().replace(/[^a-z0-9]/g, "");
    return cleanName.length > 2 ? cleanName : cleanSlug;
  };

  // 1. Fetch from Modrinth
  const fetchModrinth = async () => {
    try {
      const categoryFilters: string[] = [];
      if (loader === "fabric") {
        categoryFilters.push("categories:fabric", "categories:quilt");
      } else if (loader === "neoforge") {
        categoryFilters.push("categories:neoforge");
      } else if (loader === "forge") {
        categoryFilters.push("categories:forge");
      } else if (loader === "paper") {
        categoryFilters.push(
          "categories:paper",
          "categories:spigot",
          "categories:purpur",
          "categories:bukkit",
          "categories:folia"
        );
      } else if (loader === "quilt") {
        categoryFilters.push("categories:quilt", "categories:fabric");
      } else {
        categoryFilters.push(`categories:${loader}`);
      }

      const facets: (string[] | string)[] = [
        ["project_type:mod"],
        categoryFilters,
        [`versions:${version}`],
        ["server_side:required", "server_side:optional"],
      ];

      const modrinthUrl = new URL("https://api.modrinth.com/v2/search");
      if (qLower) {
        modrinthUrl.searchParams.set("query", qLower);
      }
      modrinthUrl.searchParams.set("facets", JSON.stringify(facets));
      // Fetch broader set to allow strict name filtering
      modrinthUrl.searchParams.set("limit", qLower ? "40" : limit.toString());
      modrinthUrl.searchParams.set("index", "downloads");

      const res = await fetch(modrinthUrl.toString(), {
        headers: {
          "User-Agent": "Minenager-WebBuilder/1.0 (contact@minenager.com)",
        },
        next: { revalidate: 300 },
      });

      if (!res.ok) return;

      const data: ModrinthSearchResponse = await res.json();
      (data.hits || []).forEach((hit) => {
        // STRICT NAME SEARCH: When searching, only accept matches where the title or slug contains the query
        if (qLower) {
          const titleMatch = hit.title.toLowerCase().includes(qLower);
          const slugMatch = hit.slug.toLowerCase().includes(qLower);
          if (!titleMatch && !slugMatch) {
            return;
          }
        }

        const key = getNormalizedKey(hit.title, hit.slug);
        resultsMap.set(key, {
          id: hit.project_id || hit.slug,
          slug: hit.slug,
          name: hit.title,
          description: hit.description,
          platform: "Modrinth",
          serverSide: hit.server_side,
          clientSide: hit.client_side,
          categories: hit.categories || [],
          downloads: hit.downloads || 0,
          iconUrl: hit.icon_url || null,
        });
      });
    } catch (err) {
      console.error("Modrinth fetch error:", err);
    }
  };

  // 2. Fetch from Hangar (especially relevant for Paper/Purpur/Spigot setups)
  const fetchHangar = async () => {
    if (loader !== "paper") return;

    try {
      const hangarUrl = new URL("https://hangar.papermc.io/api/v1/projects");
      if (qLower) {
        hangarUrl.searchParams.set("q", qLower);
      }
      hangarUrl.searchParams.set("limit", qLower ? "30" : limit.toString());

      const res = await fetch(hangarUrl.toString(), {
        headers: {
          "User-Agent": "Minenager-WebBuilder/1.0 (contact@minenager.com)",
        },
        next: { revalidate: 300 },
      });

      if (!res.ok) return;

      const data: HangarSearchResponse = await res.json();
      (data.result || []).forEach((hit) => {
        // STRICT NAME SEARCH: When searching, only accept matches where name or slug contains query
        if (qLower) {
          const nameMatch = hit.name.toLowerCase().includes(qLower);
          const slugMatch = hit.namespace.slug.toLowerCase().includes(qLower);
          if (!nameMatch && !slugMatch) {
            return;
          }
        }

        const key = getNormalizedKey(hit.name, hit.namespace.slug);
        const existing = resultsMap.get(key);

        if (existing) {
          existing.platform = "Modrinth & Hangar";
          existing.downloads = Math.max(existing.downloads, hit.stats?.downloads || 0);
          if (!existing.iconUrl && hit.avatarUrl) {
            existing.iconUrl = hit.avatarUrl;
          }
        } else {
          resultsMap.set(key, {
            id: `hangar-${hit.namespace.slug}`,
            slug: hit.namespace.slug,
            name: hit.name,
            description: hit.description,
            platform: "Hangar",
            serverSide: "required",
            clientSide: "unsupported",
            categories: ["plugin", "paper"],
            downloads: hit.stats?.downloads || 0,
            iconUrl: hit.avatarUrl || null,
          });
        }
      });
    } catch (err) {
      console.error("Hangar fetch error:", err);
    }
  };

  // Execute both searches concurrently
  await Promise.allSettled([fetchModrinth(), fetchHangar()]);

  // Convert map to array and sort with name relevance & popularity
  let combinedMods = Array.from(resultsMap.values());

  if (qLower) {
    combinedMods.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      const aSlug = a.slug.toLowerCase();
      const bSlug = b.slug.toLowerCase();

      // 1. Exact match priority (e.g. "Create" when searching "create")
      const aExact = aName === qLower || aSlug === qLower;
      const bExact = bName === qLower || bSlug === qLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      // 2. Starts-with match priority (e.g. "Create: Steam & Rails" over "Slice and Dice")
      const aStarts = aName.startsWith(qLower) || aSlug.startsWith(qLower);
      const bStarts = bName.startsWith(qLower) || bSlug.startsWith(qLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // 3. Fall back to download popularity
      return b.downloads - a.downloads;
    });
  } else {
    // Default sort by popularity
    combinedMods.sort((a, b) => b.downloads - a.downloads);
  }

  return NextResponse.json({
    mods: combinedMods.slice(0, limit),
    total: combinedMods.length,
    loader,
    version,
  });
}
