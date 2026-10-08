"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Package,
  Sparkles,
  Download,
  ExternalLink,
  Check,
  Plus,
  Trash2,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  FileCode2,
  Copy,
} from "lucide-react";

interface ModItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  author: string;
  downloads: number;
  iconUrl: string | null;
  source: "modrinth" | "hangar" | "both";
  clientSide: string;
  serverSide: string;
  categories: string[];
}

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "optimization", label: "Performance & FPS" },
  { id: "utility", label: "Administration & Tools" },
  { id: "worldgen", label: "World Gen & Biomes" },
  { id: "technology", label: "Tech & Automation" },
  { id: "chat", label: "Chat & Social" },
  { id: "economy", label: "Economy & Permissions" },
];

const LOADERS = [
  { id: "fabric", name: "Fabric", type: "mod" },
  { id: "neoforge", name: "NeoForge", type: "mod" },
  { id: "forge", name: "Forge", type: "mod" },
  { id: "paper", name: "Paper (Plugins)", type: "plugin" },
  { id: "purpur", name: "Purpur (Plugins)", type: "plugin" },
  { id: "quilt", name: "Quilt", type: "mod" },
];

export default function ModCatalogPage() {
  const [selectedLoader, setSelectedLoader] = useState("fabric");
  const [gameVersion, setGameVersion] = useState("1.21.1");
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"downloads" | "name">("downloads");

  // Mods data & loading
  const [mods, setMods] = useState<ModItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Blueprint Staging Basket
  const [basket, setBasket] = useState<ModItem[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Fetch Minecraft versions
  useEffect(() => {
    async function loadVersions() {
      try {
        const res = await fetch("/api/builder/versions");
        if (res.ok) {
          const data = await res.json();
          if (data.versions && data.versions.length > 0) {
            setAvailableVersions(data.versions);
            if (!data.versions.includes(gameVersion)) {
              setGameVersion(data.versions[0]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load versions:", err);
      }
    }
    loadVersions();
  }, []);

  // Fetch Mods whenever loader, gameVersion, or searchQuery changes
  useEffect(() => {
    let isCancelled = false;
    async function fetchMods() {
      setIsLoading(true);
      setError(null);
      try {
        const queryParams = new URLSearchParams({
          loader: selectedLoader,
          version: gameVersion,
        });
        if (searchQuery.trim()) {
          queryParams.set("q", searchQuery.trim());
        }

        const res = await fetch(`/api/builder/mods?${queryParams.toString()}`);
        if (!res.ok) {
          throw new Error("Failed to load mod catalog items");
        }
        const data = await res.json();
        if (!isCancelled) {
          setMods(data.mods || []);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err.message || "Failed to query catalog");
          setMods([]);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    const timer = setTimeout(() => {
      fetchMods();
    }, 250);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [selectedLoader, gameVersion, searchQuery]);

  // Filter and sort items
  const filteredMods = useMemo(() => {
    let result = [...mods];

    if (selectedCategory !== "all") {
      result = result.filter((item) =>
        item.categories.some((c) =>
          c.toLowerCase().includes(selectedCategory.toLowerCase())
        )
      );
    }

    if (sortBy === "downloads") {
      result.sort((a, b) => b.downloads - a.downloads);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [mods, selectedCategory, sortBy]);

  // Basket helpers
  const toggleBasketItem = (mod: ModItem) => {
    setBasket((prev) => {
      const exists = prev.some((item) => item.id === mod.id);
      if (exists) {
        return prev.filter((item) => item.id !== mod.id);
      } else {
        return [...prev, mod];
      }
    });
  };

  const isItemInBasket = (id: string) => basket.some((b) => b.id === id);

  const generateBlueprintJSON = () => {
    return JSON.stringify(
      {
        version: "1.0",
        engine: {
          loader: selectedLoader,
          gameVersion: gameVersion,
        },
        mods: basket.map((m) => ({
          name: m.name,
          slug: m.slug,
          source: m.source,
          id: m.id,
        })),
        createdAt: new Date().toISOString(),
      },
      null,
      2
    );
  };

  const copyBlueprint = () => {
    navigator.clipboard.writeText(generateBlueprintJSON());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadBlueprint = () => {
    const blob = new Blob([generateBlueprintJSON()], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minenager-${selectedLoader}-${gameVersion}-blueprint.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-mono uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              Unified Ecosystem Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
              MOD & PLUGIN CATALOG
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Live, unified server-side library querying Modrinth and Hangar.
              Check compatibility, explore packages, or stage a blueprint to
              import straight into the Minenager Server Engine.
            </p>
          </div>

          {/* Staging Basket Preview Button */}
          {basket.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-sm font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition"
              >
                <FileCode2 className="w-4 h-4" />
                <span>Blueprint Basket ({basket.length})</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 py-6">
          {/* Search Query Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search mods or plugins (e.g. Sodium, LuckPerms, Geyser)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 font-mono transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Loader Selection */}
          <div className="md:col-span-3">
            <select
              value={selectedLoader}
              onChange={(e) => setSelectedLoader(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0D1322] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer transition"
            >
              {LOADERS.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#0D1322] text-white">
                  {l.name} ({l.type.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Minecraft Version Selection */}
          <div className="md:col-span-2">
            <select
              value={gameVersion}
              onChange={(e) => setGameVersion(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#0D1322] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer transition"
            >
              {availableVersions.length > 0 ? (
                availableVersions.map((v) => (
                  <option key={v} value={v} className="bg-[#0D1322] text-white">
                    MC {v}
                  </option>
                ))
              ) : (
                <option value="1.21.1">MC 1.21.1</option>
              )}
            </select>
          </div>

          {/* Sort By Selection */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-[#0D1322] border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer transition"
            >
              <option value="downloads" className="bg-[#0D1322] text-white">Sort: Most Popular</option>
              <option value="name" className="bg-[#0D1322] text-white">Sort: Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-thin">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap transition-all border ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold"
                    : "bg-white/5 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Catalog Grid Section */}
        <div className="mt-4">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <div className="text-sm font-mono text-slate-300">
                Querying Modrinth & Hangar registries...
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Checking compatibility with {selectedLoader} on Minecraft {gameVersion}
              </p>
            </div>
          ) : error ? (
            <div className="py-16 text-center border border-red-500/20 rounded-2xl bg-red-500/5 p-8">
              <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <div className="text-base font-semibold text-white">
                Unable to load package data
              </div>
              <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">{error}</p>
            </div>
          ) : filteredMods.length === 0 ? (
            <div className="py-20 text-center border border-white/5 rounded-2xl bg-white/[0.02] p-8">
              <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <div className="text-base font-medium text-slate-300">
                No matching packages found
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Try clearing your search query or selecting a different loader or Minecraft version.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMods.map((mod) => {
                const inBasket = isItemInBasket(mod.id);
                return (
                  <div
                    key={mod.id}
                    className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                      inBasket
                        ? "bg-cyan-950/20 border-cyan-500/50 shadow-lg shadow-cyan-950/30"
                        : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                    }`}
                  >
                    <div>
                      {/* Card Header: Icon & Badges */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 flex-shrink-0 flex items-center justify-center overflow-hidden">
                          {mod.iconUrl ? (
                            <img
                              src={mod.iconUrl}
                              alt={mod.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <Package className="w-6 h-6 text-slate-500" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white text-base truncate font-mono">
                              {mod.name}
                            </h3>
                          </div>
                          <div className="text-xs text-slate-400 truncate">
                            by <span className="text-slate-300 font-mono">{mod.author}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4">
                        {mod.description || "No description provided."}
                      </p>

                      {/* Source & Compatibility Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        {mod.source === "both" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            Modrinth & Hangar
                          </span>
                        ) : mod.source === "modrinth" ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            Modrinth
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            Hangar
                          </span>
                        )}

                        {mod.serverSide === "required" && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            Server Required
                          </span>
                        )}

                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400">
                          {(mod.downloads || 0).toLocaleString()} downloads
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                      <a
                        href={
                          mod.source === "hangar"
                            ? `https://hangar.papermc.io/${mod.author}/${mod.slug}`
                            : `https://modrinth.com/mod/${mod.slug}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition flex items-center gap-1"
                      >
                        <span>View Project</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <button
                        onClick={() => toggleBasketItem(mod)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition flex items-center gap-1.5 ${
                          inBasket
                            ? "bg-cyan-500 text-black hover:bg-cyan-400"
                            : "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                        }`}
                      >
                        {inBasket ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>In Blueprint</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add to Blueprint</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Blueprint Staging Basket Modal */}
        {showExportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#0A0F1D] border border-white/10 rounded-2xl max-w-xl w-full p-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileCode2 className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-mono font-bold text-lg text-white">
                    Blueprint Staging Basket
                  </h3>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="text-xs font-mono text-slate-400 hover:text-white"
                >
                  Close [ESC]
                </button>
              </div>

              <div className="py-4">
                <div className="text-xs font-mono text-slate-400 mb-2 flex items-center justify-between">
                  <span>
                    Selected {basket.length} package{basket.length > 1 ? "s" : ""} for {selectedLoader} ({gameVersion}):
                  </span>
                  {basket.length > 0 && (
                    <button
                      onClick={() => setBasket([])}
                      className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear All
                    </button>
                  )}
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {basket.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/5 text-xs font-mono"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="text-slate-400 text-[10px]">({item.source})</span>
                      </div>
                      <button
                        onClick={() => toggleBasketItem(item)}
                        className="text-slate-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/5 text-xs font-mono text-slate-300">
                  <div className="text-slate-400 mb-1">Import Instructions:</div>
                  Open the <strong>Minenager Server Engine</strong> &gt; Click <em>"Import Blueprint"</em> &gt; Paste this blueprint to automatically download the exact loader builds and packages.
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  onClick={copyBlueprint}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? "Copied!" : "Copy JSON"}</span>
                </button>

                <button
                  onClick={downloadBlueprint}
                  className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
