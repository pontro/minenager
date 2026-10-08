"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Download, Plus, Check, Loader2, Server, Sparkles, ArrowRight } from "lucide-react";

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

export default function SandboxBuilder() {
  const [version, setVersion] = useState("1.20.1");
  const [loader, setLoader] = useState("Fabric");
  const [searchQuery, setSearchQuery] = useState("");
  const [availableMods, setAvailableMods] = useState<ModItem[]>([]);
  const [selectedMods, setSelectedMods] = useState<Map<string, ModItem>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [versionsList, setVersionsList] = useState<string[]>([
    "1.21.4",
    "1.21.1",
    "1.20.4",
    "1.20.1",
    "1.19.4",
    "1.19.2",
    "1.18.2",
  ]);
  const [exportFeedback, setExportFeedback] = useState(false);

  // Fetch available versions on mount
  useEffect(() => {
    async function loadVersions() {
      try {
        const res = await fetch("/api/builder/versions");
        if (res.ok) {
          const data = await res.json();
          if (data.featured && Array.isArray(data.featured)) {
            setVersionsList(data.featured);
          }
        }
      } catch (err) {
        console.error("Failed to load versions", err);
      }
    }
    loadVersions();
  }, []);

  // Fetch server-side mods whenever version, loader, or search changes
  const fetchMods = useCallback(
    async (q: string, l: string, v: string) => {
      if (l.toLowerCase() === "vanilla") {
        setAvailableMods([]);
        return;
      }
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          query: q,
          loader: l.toLowerCase(),
          version: v,
          limit: "20",
        });
        const res = await fetch(`/api/builder/mods?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const list: ModItem[] = data.mods || [];
          setAvailableMods(list);

          // Select top 2 mods by default on initial empty load if nothing selected yet
          setSelectedMods((prev) => {
            if (prev.size === 0 && list.length > 0 && !q) {
              const initialMap = new Map<string, ModItem>();
              list.slice(0, 2).forEach((mod) => initialMap.set(mod.id, mod));
              return initialMap;
            }
            return prev;
          });
        }
      } catch (err) {
        console.error("Error fetching mods", err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMods(searchQuery, loader, version);
    }, 280);

    return () => clearTimeout(handler);
  }, [searchQuery, loader, version, fetchMods]);

  const toggleModSelection = (mod: ModItem) => {
    setSelectedMods((prev) => {
      const next = new Map(prev);
      if (next.has(mod.id)) {
        next.delete(mod.id);
      } else {
        next.set(mod.id, mod);
      }
      return next;
    });
  };

  const getPlatformBadgeStyle = (platform: string) => {
    if (platform.includes("Hangar") && platform.includes("Modrinth")) {
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    }
    if (platform.includes("Hangar")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  };

  const handleExportBlueprint = () => {
    const selectedList = Array.from(selectedMods.values());
    const blueprint = {
      format_version: 1,
      name: `custom-${loader.toLowerCase()}-${version}-server`,
      engine: "minenager-desktop-v1",
      minecraft_version: version,
      mod_loader: loader.toLowerCase(),
      created_at: new Date().toISOString(),
      server_properties: {
        "server-port": 25565,
        "max-players": 20,
        difficulty: "normal",
        pvp: true,
        gamemode: "survival",
        motd: `A Minenager ${loader} ${version} Server`,
      },
      mods: selectedList.map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        platform: m.platform,
        server_side: m.serverSide,
      })),
    };

    const blob = new Blob([JSON.stringify(blueprint, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minenager-blueprint-${loader.toLowerCase()}-${version}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 2500);
  };

  return (
    <div className="p-6 sm:p-7 rounded-2xl bg-card-glass border border-white/10 shadow-2xl relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5 font-mono text-sm font-bold text-white">
          <Server className="w-4.5 h-4.5 text-cyan-400" />
          <span>Demo Builder</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>Server-Side Only</span>
          </span>
        </div>
      </div>

      {/* Version & Loader Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs sm:text-sm font-mono text-slate-300 font-medium mb-1.5">
            Minecraft Version
          </label>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            {versionsList.map((v) => (
              <option key={v} value={v}>
                {v} {v === "1.20.1" ? "(Most Modded)" : v === "1.21.4" ? "(Latest)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs sm:text-sm font-mono text-slate-300 font-medium mb-1.5">
            Target Loader
          </label>
          <select
            value={loader}
            onChange={(e) => setLoader(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="Fabric">Fabric (Fast &amp; Modern)</option>
            <option value="NeoForge">NeoForge (Modern Forge)</option>
            <option value="Forge">Forge (Classic Mods)</option>
            <option value="Paper">Paper (Plugins &amp; SMP)</option>
            <option value="Vanilla">Vanilla (No Mods)</option>
          </select>
        </div>
      </div>

      {/* Mod Search Bar (disabled for Vanilla) */}
      {loader.toLowerCase() !== "vanilla" && (
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search server-compatible ${loader === "Paper" ? "plugins" : "mods"} by name...`}
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5 top-3.5" />
          )}
        </div>
      )}

      {/* Mod List Display - Enlarged and easily readable */}
      <div className="space-y-3 mb-5 max-h-72 overflow-y-auto pr-1">
        {loader.toLowerCase() === "vanilla" ? (
          <div className="py-12 text-center text-sm font-mono text-slate-400 bg-white/5 rounded-xl border border-white/5 px-4">
            <Server className="w-8 h-8 text-cyan-400 mx-auto mb-2 opacity-80" />
            <p className="font-bold text-white">Vanilla Minecraft Selected</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Vanilla runs the official unmodified Mojang server without mod loaders.
            </p>
          </div>
        ) : isLoading && availableMods.length === 0 ? (
          <div className="py-12 text-center text-xs sm:text-sm font-mono text-slate-400 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
            <span>Finding verified server mods for {loader} {version}...</span>
          </div>
        ) : availableMods.length === 0 ? (
          <div className="py-10 text-center text-xs sm:text-sm font-mono text-slate-500">
            No server-compatible mods found for &quot;{searchQuery}&quot; on {loader} {version}
          </div>
        ) : (
          availableMods.map((mod) => {
            const isSelected = selectedMods.has(mod.id);
            return (
              <div
                key={mod.id}
                onClick={() => toggleModSelection(mod)}
                className={`p-3.5 sm:p-4 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3.5 ${
                  isSelected
                    ? "bg-cyan-950/30 border-cyan-500/50"
                    : "bg-white/5 border-white/5 hover:border-white/20"
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                      isSelected
                        ? "bg-cyan-400 shadow-[0_0_8px_#06B6D4]"
                        : "bg-zinc-600"
                    }`}
                  />
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-white flex items-center gap-2 truncate">
                      <span className="truncate">{mod.name}</span>
                      <span
                        className={`text-[10px] sm:text-xs font-mono px-1.5 py-0.2 rounded border shrink-0 ${getPlatformBadgeStyle(
                          mod.platform
                        )}`}
                      >
                        {mod.platform}
                      </span>
                      {mod.downloads > 0 && (
                        <span className="text-[11px] font-mono text-slate-400 shrink-0 hidden sm:inline">
                          {(mod.downloads / 1000000).toFixed(1)}M DLs
                        </span>
                      )}
                    </div>
                    <div className="text-slate-300 text-xs sm:text-sm truncate mt-0.5">
                      {mod.description || "Server compatibility verified"}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <span className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Added
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Bottom Action & Blueprint Summary Bar */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="text-xs sm:text-sm font-mono text-white font-semibold">
          {loader} {version} • {selectedMods.size} {loader === "Paper" ? "Plugins" : "Server Mods"}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportBlueprint}
            className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shrink-0"
          >
            {exportFeedback ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Blueprint Exported!</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Blueprint</span>
              </>
            )}
          </button>
          <Link
            href="/build"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold font-mono text-xs sm:text-sm flex items-center justify-center gap-1.5 transition border border-white/10 shrink-0"
          >
            <span>Full Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
