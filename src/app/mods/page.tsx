"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Squares from "@/components/ui/react-bits/Squares";
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
  X,
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

const LOADERS = [
  { id: "fabric", name: "Fabric" },
  { id: "neoforge", name: "NeoForge" },
  { id: "forge", name: "Forge" },
  { id: "paper", name: "Paper" },
  { id: "purpur", name: "Purpur" },
  { id: "quilt", name: "Quilt" },
];

export default function ModCatalogPage() {
  const [selectedLoader, setSelectedLoader] = useState("fabric");
  const [gameVersion, setGameVersion] = useState("1.21.1");
  const [availableVersions, setAvailableVersions] = useState<string[]>([
    "1.21.4",
    "1.21.1",
    "1.20.4",
    "1.20.1",
    "1.19.4",
    "1.19.2",
    "1.18.2",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
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
          const list = data.featured || data.versions || data.all || [];
          if (list.length > 0) {
            setAvailableVersions(list);
            if (!list.includes(gameVersion)) {
              setGameVersion(list[0]);
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

  // Sort items
  const filteredMods = useMemo(() => {
    let result = [...mods];

    if (sortBy === "downloads") {
      result.sort((a, b) => b.downloads - a.downloads);
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [mods, sortBy]);

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

  const formatDownloads = (count: number) => {
    if (!count) return "0 downloads";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M downloads`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}k downloads`;
    return `${count} downloads`;
  };

  const getPlatformBadgeStyle = (source: string) => {
    if (source === "both") {
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/30";
    }
    if (source === "hangar") {
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    }
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  };

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Full-Page Dynamic Animated Squares Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Squares
          direction="diagonal"
          speed={0.15}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.045)"
          hoverFillColor="rgba(6, 182, 212, 0.12)"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 pt-24 pb-16 lg:pt-28 space-y-6">
          {/* Header Title */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/10">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
                MOD &amp; PLUGIN CATALOG
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-2xl leading-relaxed">
                Live, unified server-side library querying Modrinth &amp; Hangar.
                Check compatibility, explore packages, or stage a blueprint to
                import directly into the Minenager Server Engine.
              </p>
            </div>

            {/* Staging Basket Preview Button */}
            {basket.length > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setShowExportModal(true)}
                  className="px-5 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm font-mono flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition cursor-pointer"
                >
                  <FileCode2 className="w-4 h-4" />
                  <span>Blueprint Basket ({basket.length})</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Filter Controls Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-[#0B1120] border border-white/15 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Search Query Input */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search mods or plugins (e.g. Sodium, LuckPerms)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-9 py-2.5 bg-[#060a14] border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Loader Selection */}
              <div className="md:col-span-3">
                <select
                  value={selectedLoader}
                  onChange={(e) => setSelectedLoader(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#060a14] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer transition"
                >
                  {LOADERS.map((l) => (
                    <option key={l.id} value={l.id} className="bg-[#0B1120] text-white">
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Minecraft Version Selection */}
              <div className="md:col-span-2">
                <select
                  value={gameVersion}
                  onChange={(e) => setGameVersion(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#060a14] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer transition"
                >
                  {availableVersions.map((v) => (
                    <option key={v} value={v} className="bg-[#0B1120] text-white">
                      {v}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort By Selection */}
              <div className="md:col-span-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#060a14] border border-white/15 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 font-mono cursor-pointer transition"
                >
                  <option value="downloads" className="bg-[#0B1120] text-white">Most Popular</option>
                  <option value="name" className="bg-[#0B1120] text-white">Alphabetical</option>
                </select>
              </div>
            </div>
          </div>

          {/* Catalog Grid Section */}
          <div>
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
                <div className="text-sm font-mono text-slate-300">
                  Querying Modrinth &amp; Hangar registries...
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Checking compatibility with {selectedLoader} on Minecraft {gameVersion}
                </p>
              </div>
            ) : error ? (
              <div className="py-16 text-center border border-red-500/20 rounded-2xl bg-[#0B1120] p-8 shadow-xl">
                <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <div className="text-base font-semibold text-white font-mono">
                  Unable to load package data
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto font-mono">{error}</p>
              </div>
            ) : filteredMods.length === 0 ? (
              <div className="py-20 text-center border border-white/10 rounded-2xl bg-[#0B1120] p-8 shadow-xl">
                <Package className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <div className="text-base font-bold text-slate-300 font-mono">
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
                      className={`group relative rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
                        inBasket
                          ? "bg-cyan-500/[0.08] border-cyan-500/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)] ring-1 ring-cyan-400/20"
                          : "bg-[#0B1120] border-white/15 hover:border-white/25 hover:bg-[#0e1628]"
                      }`}
                    >
                      {/* Active Left Marker Line */}
                      {inBasket && (
                        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                      )}

                      <div>
                        {/* Card Header: Icon & Badges */}
                        <div className="flex items-start gap-3.5 mb-3 pl-1">
                          <div className="w-12 h-12 rounded-xl bg-black/40 border border-white/10 shrink-0 flex items-center justify-center overflow-hidden">
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
                              <h3 className={`font-bold text-base truncate font-mono transition ${inBasket ? "text-cyan-300" : "text-white group-hover:text-cyan-300"}`}>
                                {mod.name}
                              </h3>
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5 font-mono">
                              by <span className="text-slate-300">{mod.author}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-4 pl-1">
                          {mod.description || "Verified server compatibility."}
                        </p>

                        {/* Source & Compatibility Tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-4 pl-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${getPlatformBadgeStyle(mod.source)}`}>
                            {mod.source === "both" ? "Modrinth & Hangar" : mod.source === "modrinth" ? "Modrinth" : "Hangar"}
                          </span>

                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400">
                            {formatDownloads(mod.downloads)}
                          </span>
                        </div>
                      </div>

                      {/* Bottom Actions */}
                      <div className="pt-3 border-t border-white/10 flex items-center justify-between pl-1">
                        <a
                          href={
                            mod.source === "hangar"
                              ? `https://hangar.papermc.io/${mod.author ? `${mod.author}/` : ""}${mod.slug}`
                              : `https://modrinth.com/mod/${mod.slug}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-mono text-slate-400 hover:text-cyan-400 transition flex items-center gap-1"
                        >
                          <span>Project</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>

                        <button
                          onClick={() => toggleBasketItem(mod)}
                          className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer ${
                            inBasket
                              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <div className="bg-[#0B1120] border border-white/15 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <FileCode2 className="w-5 h-5 text-cyan-400" />
                    <h3 className="font-mono font-bold text-lg text-white">
                      Blueprint Staging Basket
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowExportModal(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="text-xs font-mono text-slate-300 flex items-center justify-between">
                    <span>
                      Staged {basket.length} package{basket.length > 1 ? "s" : ""} for {selectedLoader} (MC {gameVersion}):
                    </span>
                    {basket.length > 0 && (
                      <button
                        onClick={() => setBasket([])}
                        className="text-red-400 hover:text-red-300 text-xs flex items-center gap-1 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear All
                      </button>
                    )}
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                    {basket.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#060a14] border border-white/10 text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="font-bold text-white">{item.name}</span>
                          <span className="text-slate-400 text-[10px]">({item.source})</span>
                        </div>
                        <button
                          onClick={() => toggleBasketItem(item)}
                          className="text-slate-400 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-[#060a14]/70 rounded-xl border border-white/10 text-xs font-mono text-slate-300 space-y-1">
                    <div className="text-cyan-400 font-bold">Import Instructions:</div>
                    <p className="text-slate-400 leading-relaxed text-[11px]">
                      Open the <strong>Minenager Server Engine</strong> &gt; Click <em>"Import Blueprint"</em> &gt; Drag or paste this JSON to auto-download all staged packages.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={copyBlueprint}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition border border-white/15 cursor-pointer"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-cyan-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "Copied!" : "Copy JSON"}</span>
                  </button>

                  <button
                    onClick={downloadBlueprint}
                    className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono text-xs font-bold flex items-center gap-1.5 transition shadow-lg shadow-cyan-500/25 cursor-pointer"
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
    </div>
  );
}
