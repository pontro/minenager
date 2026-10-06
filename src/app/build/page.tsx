"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Search,
  Download,
  Plus,
  Trash2,
  Check,
  Loader2,
  Server,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Copy,
  Cpu,
  Users,
  Eye,
  Activity,
  Layers,
  Gamepad2,
  Smartphone,
  Sliders,
  Package,
  Boxes,
  RotateCcw,
  Zap,
} from "lucide-react";

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

export default function GuidedBuilderPage() {
  // Wizard Step (1: Engine, 2: Mods, 3: Hardware, 4: Launch Card)
  const [step, setStep] = useState<number>(1);

  // Core Engine Settings
  const [version, setVersion] = useState("1.20.1");
  const [loader, setLoader] = useState("Fabric");
  const [loaderVersion, setLoaderVersion] = useState("");
  const [loaderVersionsList, setLoaderVersionsList] = useState<string[]>([]);
  const [versionsList, setVersionsList] = useState<string[]>([
    "1.21.4",
    "1.21.1",
    "1.20.4",
    "1.20.1",
    "1.19.4",
    "1.19.2",
    "1.18.2",
  ]);

  // Server Properties & Hardware Config
  const [serverName, setServerName] = useState("My Minenager Server");
  const [motd, setMotd] = useState("A customized Minecraft server built with Minenager");
  const [ramGb, setRamGb] = useState(6);
  const [maxPlayers, setMaxPlayers] = useState(20);
  const [viewDistance, setViewDistance] = useState(10);
  const [simulationDistance, setSimulationDistance] = useState(8);
  const [difficulty, setDifficulty] = useState("normal");
  const [gamemode, setGamemode] = useState("survival");
  const [pvp, setPvp] = useState(true);
  const [hardcore, setHardcore] = useState(false);
  const [enableGeyser, setEnableGeyser] = useState(false);

  // Mod Search & Selection
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [availableMods, setAvailableMods] = useState<ModItem[]>([]);
  const [selectedMods, setSelectedMods] = useState<Map<string, ModItem>>(new Map());
  const [isLoadingMods, setIsLoadingMods] = useState(false);

  // Feedback States
  const [copiedJson, setCopiedJson] = useState(false);
  const [exportFeedback, setExportFeedback] = useState(false);

  // 1. Fetch Minecraft Release Versions
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

  // 2. Fetch Compatible Loader Builds when Version or Loader changes
  useEffect(() => {
    async function loadLoaderBuilds() {
      try {
        const res = await fetch(
          `/api/builder/loader-versions?loader=${loader.toLowerCase()}&version=${version}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.versions && Array.isArray(data.versions)) {
            setLoaderVersionsList(data.versions);
            setLoaderVersion(data.recommended || data.versions[0] || "");
          }
        }
      } catch (err) {
        console.error("Failed to load loader versions", err);
      }
    }
    loadLoaderBuilds();
  }, [loader, version]);

  // 3. Fetch Server-Side Mods
  const fetchMods = useCallback(
    async (q: string, l: string, v: string) => {
      if (l.toLowerCase() === "vanilla") {
        setAvailableMods([]);
        return;
      }
      setIsLoadingMods(true);
      try {
        const params = new URLSearchParams({
          query: q,
          loader: l.toLowerCase(),
          version: v,
          limit: "36",
        });
        const res = await fetch(`/api/builder/mods?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const list: ModItem[] = data.mods || [];
          setAvailableMods(list);

          // Auto-select initial optimization mods if nothing selected yet
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
        setIsLoadingMods(false);
      }
    },
    []
  );

  // Debounced Search Trigger
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchMods(searchQuery, loader, version);
    }, 280);

    return () => clearTimeout(handler);
  }, [searchQuery, loader, version, fetchMods]);

  // Mod Toggling
  const toggleMod = (mod: ModItem) => {
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

  const removeMod = (id: string) => {
    setSelectedMods((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  // Recommended RAM based on Mod Count
  const modCount = selectedMods.size;
  const recommendedRam =
    loader.toLowerCase() === "vanilla"
      ? 2
      : modCount > 25
      ? 10
      : modCount > 15
      ? 8
      : modCount > 6
      ? 6
      : 4;

  const getPlatformBadgeStyle = (platform: string) => {
    if (platform.includes("Hangar") && platform.includes("Modrinth")) {
      return "bg-cyan-500/10 text-cyan-300 border-cyan-500/30";
    }
    if (platform.includes("Hangar")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    }
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  };

  // View Distance Performance Evaluator
  const getViewDistancePerformance = (dist: number) => {
    if (dist <= 8) {
      return {
        label: "Low RAM & Network Impact",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        desc: "Best for low RAM computers and budget home networks.",
      };
    }
    if (dist <= 12) {
      return {
        label: "Balanced (Standard)",
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        desc: "Recommended for smooth multiplayer gameplay without memory strain.",
      };
    }
    if (dist <= 18) {
      return {
        label: "Heavy RAM & Bandwidth Load",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        desc: "Each player loads up to 400 chunks. Recommend at least 8GB RAM.",
      };
    }
    return {
      label: "Extreme Server RAM Usage",
      color: "text-red-400 bg-red-500/10 border-red-500/30",
      desc: "Massive memory usage. Requires dedicated high-end RAM and fiber internet.",
    };
  };

  // Simulation Distance Performance Evaluator
  const getSimulationPerformance = (dist: number) => {
    if (dist <= 5) {
      return {
        label: "Low CPU Impact (Maximum TPS)",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
        desc: "Entities and redstone only tick close to players. High server FPS.",
      };
    }
    if (dist <= 8) {
      return {
        label: "Balanced CPU Load (Standard)",
        color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30",
        desc: "Standard Minecraft SMP simulation. Mob farms and crop growth run smoothly.",
      };
    }
    if (dist <= 12) {
      return {
        label: "High CPU Load",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
        desc: "Heavy mob AI, mob farms, and redstone ticking. Requires modern multi-core CPU.",
      };
    }
    return {
      label: "Extreme CPU Tick Load",
      color: "text-red-400 bg-red-500/10 border-red-500/30",
      desc: "Severe CPU tick load. Can cause TPS drops if multiple players build large farms.",
    };
  };

  const viewPerf = getViewDistancePerformance(viewDistance);
  const simPerf = getSimulationPerformance(simulationDistance);

  // Filtered Available Mods by Category
  const filteredAvailableMods = availableMods.filter((mod) => {
    if (selectedCategory === "all") return true;
    return mod.categories.some((c) =>
      c.toLowerCase().includes(selectedCategory.toLowerCase())
    );
  });

  // Generate Blueprint Object
  const generateBlueprint = () => {
    const selectedList = Array.from(selectedMods.values());
    return {
      format_version: 1,
      name: serverName.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      engine: "minenager-desktop-v1",
      created_at: new Date().toISOString(),
      server: {
        name: serverName,
        minecraft_version: version,
        loader: loader.toLowerCase(),
        loader_version: loaderVersion,
        jvm_ram_gb: ramGb,
        bedrock_crossplay_geyser: enableGeyser,
      },
      server_properties: {
        "server-port": 25565,
        "max-players": maxPlayers,
        "view-distance": viewDistance,
        "simulation-distance": simulationDistance,
        difficulty: difficulty,
        gamemode: gamemode,
        pvp: pvp,
        hardcore: hardcore,
        motd: motd,
      },
      mods: selectedList.map((m) => ({
        id: m.id,
        slug: m.slug,
        name: m.name,
        platform: m.platform,
        server_side: m.serverSide,
      })),
    };
  };

  const handleExportBlueprint = () => {
    const blueprint = generateBlueprint();
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

  const handleCopyJson = async () => {
    try {
      const blueprint = generateBlueprint();
      await navigator.clipboard.writeText(JSON.stringify(blueprint, null, 2));
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#060913]">
      <Navbar />

      {/* WIZARD CONTAINER */}
      <div className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full space-y-8">
        
        {/* Step Progress Bar */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-card-glass border border-white/10 flex items-center justify-between gap-2">
          {[
            { num: 1, title: "1. Core Engine" },
            { num: 2, title: "2. Add Mods" },
            { num: 3, title: "3. Server Hardware" },
            { num: 4, title: "4. Review & Deploy" },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num)}
              className={`flex-1 py-3 px-2 sm:px-3 rounded-xl text-center font-mono text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
                step === s.num
                  ? "bg-cyan-400 text-black shadow-lg glow-primary"
                  : step > s.num
                  ? "bg-white/10 text-cyan-300"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <span>{s.title}</span>
            </button>
          ))}
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: CORE ENGINE & LOADER SELECTION                                    */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Step 1: Choose Your Minecraft Engine
              </h1>
              <p className="text-slate-300 text-base mt-2">
                Select your base Minecraft version and desired server mod loader.
              </p>
            </div>

            {/* Version Dropdown Bar */}
            <div className="p-6 rounded-2xl bg-card-glass border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="block text-sm font-mono text-slate-300 font-bold mb-1">
                  Target Minecraft Version
                </label>
                <p className="text-xs text-slate-400">
                  Select stable release version. 1.20.1 is recommended for largest mod library.
                </p>
              </div>

              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm sm:text-base font-mono font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer min-w-48"
              >
                {versionsList.map((v) => (
                  <option key={v} value={v} className="bg-[#0B1120] text-white">
                    {v} {v === "1.20.1" ? "(Recommended)" : v === "1.21.4" ? "(Latest)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Loader Selection Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  name: "Fabric",
                  badge: "Fast & Modern",
                  desc: "Ultra lightweight, high performance runtime with the newest mods and optimization engines.",
                },
                {
                  name: "NeoForge",
                  badge: "Next-Gen Forge",
                  desc: "Modern Forge fork with modern mod compatibility and next-generation architecture.",
                },
                {
                  name: "Forge",
                  badge: "Classic Modding",
                  desc: "The classic modding engine with hundreds of thousands of expansive content modpacks.",
                },
                {
                  name: "Paper",
                  badge: "Plugins & SMP",
                  desc: "High performance PaperMC server optimized for Spigot/Paper plugins, anti-grief, and survival.",
                },
                {
                  name: "Quilt",
                  badge: "Modular Fork",
                  desc: "Modular fork of Fabric with broad backwards-compatibility for Fabric mods.",
                },
                {
                  name: "Vanilla",
                  badge: "Official Mojang",
                  desc: "Official unmodified Minecraft server without mod loaders or custom code.",
                },
              ].map((l) => (
                <div
                  key={l.name}
                  onClick={() => setLoader(l.name)}
                  className={`p-6 rounded-2xl border transition cursor-pointer text-left flex flex-col justify-between ${
                    loader === l.name
                      ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.2)] glow-primary"
                      : "bg-card-glass border-white/10 hover:border-white/20"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-xl text-white font-mono">{l.name}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-cyan-300">
                        {l.badge}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-2">
                      {l.desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                    <span className={loader === l.name ? "text-cyan-400 font-bold" : "text-slate-500"}>
                      {loader === l.name ? "Selected Engine" : "Click to select"}
                    </span>
                    {loader === l.name && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Next */}
            <div className="flex justify-end pt-4">
              <button
                onClick={() => setStep(2)}
                className="px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center gap-2 transition glow-primary"
              >
                <span>Continue to Add Mods</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: ADD SUPERPOWERS & MODS                                            */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                  <span>Step 2: Add Superpowers &amp; Mods</span>
                  <span className="text-xs font-mono px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {selectedMods.size} Mods Added
                  </span>
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  1-click add verified server-side mods from Modrinth &amp; Hangar for {loader} {version}.
                </p>
              </div>

              {loader.toLowerCase() !== "vanilla" && (
                <div className="relative w-full md:w-80">
                  <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mods by name..."
                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  {isLoadingMods && (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin absolute right-3.5 top-3.5" />
                  )}
                </div>
              )}
            </div>

            {/* Category Filter Pills */}
            {loader.toLowerCase() !== "vanilla" && (
              <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
                {[
                  { id: "all", label: "All Mods" },
                  { id: "optimization", label: "⚡ Optimization" },
                  { id: "utility", label: "🛠️ Utilities" },
                  { id: "worldgen", label: "🌍 WorldGen" },
                  { id: "technology", label: "⚙️ Technology" },
                  { id: "social", label: "🎙️ Chat & Audio" },
                  { id: "management", label: "🛡️ Administration" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg border transition ${
                      selectedCategory === cat.id
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                        : "bg-white/5 text-slate-400 border-white/5 hover:border-white/20"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            )}

            {/* Mod List Display */}
            {loader.toLowerCase() === "vanilla" ? (
              <div className="py-20 text-center text-sm font-mono text-slate-400 bg-card-glass rounded-2xl border border-white/10 px-6 max-w-xl mx-auto">
                <Server className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-80" />
                <h3 className="font-bold text-lg text-white">Vanilla Minecraft Engine</h3>
                <p className="text-sm text-slate-400 mt-2 mb-6">
                  Vanilla runs unmodded official Mojang server code. No mods can be added.
                </p>
                <button
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-xs transition"
                >
                  Switch to Fabric or NeoForge
                </button>
              </div>
            ) : isLoadingMods && availableMods.length === 0 ? (
              <div className="py-24 text-center text-sm font-mono text-slate-400 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                <span>Finding verified server mods for {loader} {version}...</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-1">
                {filteredAvailableMods.map((mod) => {
                  const isSelected = selectedMods.has(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleMod(mod)}
                      className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? "bg-cyan-950/30 border-cyan-500/50 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                          : "bg-card-glass border-white/10 hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {mod.iconUrl ? (
                          <img
                            src={mod.iconUrl}
                            alt={mod.name}
                            className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-sm shrink-0">
                            {mod.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="font-bold text-base text-white truncate flex items-center gap-2">
                            <span className="truncate">{mod.name}</span>
                            <span className={`text-xs font-mono px-1.5 py-0.2 rounded border shrink-0 ${getPlatformBadgeStyle(mod.platform)}`}>
                              {mod.platform}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm text-slate-300 truncate mt-0.5">
                            {mod.description || "Verified server compatibility"}
                          </div>
                          {mod.downloads > 0 && (
                            <div className="text-[11px] font-mono text-slate-400 mt-1">
                              {(mod.downloads / 1000000).toFixed(1)}M downloads
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="text-xs font-mono px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-sm flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Engine
              </button>

              <button
                onClick={() => setStep(3)}
                className="px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center gap-2 transition glow-primary"
              >
                <span>Continue to Hardware Config</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: HARDWARE & PERFORMANCE CONFIG                                     */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Step 3: Server Hardware &amp; Performance
              </h2>
              <p className="text-slate-300 text-base mt-2">
                Allocate system memory, render distance, and multiplayer gameplay settings.
              </p>
            </div>

            {/* RAM Allocation Card */}
            <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-mono text-sm sm:text-base font-bold text-white">
                  <Cpu className="w-5 h-5 text-cyan-400" /> RAM Memory Allocation
                </div>
                <div className="flex items-center gap-3">
                  {ramGb < recommendedRam && (
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Recommend {recommendedRam}GB for {modCount} mods
                    </span>
                  )}
                  <span className="font-mono text-xl font-bold text-cyan-400">
                    {ramGb} GB RAM
                  </span>
                </div>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                step="1"
                value={ramGb}
                onChange={(e) => setRamGb(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-white/10 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-xs font-mono text-slate-400 mt-2">
                <span>2 GB (Vanilla / Light)</span>
                <span>6 GB (Recommended)</span>
                <span>12 GB (Heavy Modpack)</span>
                <span>24 GB (Extreme)</span>
              </div>
            </div>

            {/* View Distance & Simulation Distance Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* View Distance */}
              <div className="p-6 rounded-2xl bg-card-glass border border-white/10 space-y-3">
                <div className="flex items-center justify-between font-mono text-base text-white font-bold">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" /> View Distance
                  </div>
                  <span className="text-cyan-400 font-bold">{viewDistance} Chunks</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="32"
                  step="1"
                  value={viewDistance}
                  onChange={(e) => setViewDistance(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-white/10 rounded-lg appearance-none"
                />
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Resource Impact:</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${viewPerf.color}`}>
                      {viewPerf.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{viewPerf.desc}</p>
                </div>
              </div>

              {/* Simulation Distance */}
              <div className="p-6 rounded-2xl bg-card-glass border border-white/10 space-y-3">
                <div className="flex items-center justify-between font-mono text-base text-white font-bold">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" /> Simulation Distance
                  </div>
                  <span className="text-cyan-400 font-bold">{simulationDistance} Chunks</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="16"
                  step="1"
                  value={simulationDistance}
                  onChange={(e) => setSimulationDistance(parseInt(e.target.value, 10))}
                  className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-white/10 rounded-lg appearance-none"
                />
                <div className="pt-2 border-t border-white/5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">CPU Impact:</span>
                    <span className={`text-xs font-mono px-2 py-0.5 rounded border ${simPerf.color}`}>
                      {simPerf.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{simPerf.desc}</p>
                </div>
              </div>
            </div>

            {/* Game Rules & Bedrock Crossplay */}
            <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 space-y-6">
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider">
                <Gamepad2 className="w-5 h-5" /> Gameplay &amp; Crossplay Rules
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs sm:text-sm font-mono text-slate-300 font-medium mb-1.5">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 capitalize cursor-pointer"
                  >
                    <option value="peaceful">Peaceful</option>
                    <option value="easy">Easy</option>
                    <option value="normal">Normal</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-mono text-slate-300 font-medium mb-1.5">Gamemode</label>
                  <select
                    value={gamemode}
                    onChange={(e) => setGamemode(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 capitalize cursor-pointer"
                  >
                    <option value="survival">Survival</option>
                    <option value="creative">Creative</option>
                    <option value="adventure">Adventure</option>
                    <option value="spectator">Spectator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-mono text-slate-300 font-medium mb-1.5">Max Players</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Bedrock Toggle & PvP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
                <div className="p-4 rounded-xl bg-black/40 border border-white/5 flex items-center gap-6">
                  <label className="flex items-center gap-2.5 text-sm font-mono text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pvp}
                      onChange={(e) => setPvp(e.target.checked)}
                      className="accent-cyan-400 w-4 h-4 rounded"
                    />
                    <span>Allow PvP</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-sm font-mono text-slate-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hardcore}
                      onChange={(e) => setHardcore(e.target.checked)}
                      className="accent-cyan-400 w-4 h-4 rounded"
                    />
                    <span>Hardcore Mode</span>
                  </label>
                </div>

                <div
                  onClick={() => setEnableGeyser(!enableGeyser)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    enableGeyser
                      ? "bg-cyan-950/30 border-cyan-500/50"
                      : "bg-black/40 border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="font-bold text-sm text-white">Bedrock Crossplay (GeyserMC)</div>
                      <div className="text-xs text-slate-400">Xbox, PS, Switch, Mobile</div>
                    </div>
                  </div>
                  <span className={`text-xs font-mono px-2.5 py-1 rounded-lg border ${enableGeyser ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-bold" : "bg-white/5 text-slate-400 border-white/10"}`}>
                    {enableGeyser ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-4 border-t border-white/5">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-sm flex items-center gap-2 transition"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Mods
              </button>

              <button
                onClick={() => setStep(4)}
                className="px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center gap-2 transition glow-primary"
              >
                <span>Review Final Blueprint</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: REVIEW & DEPLOY SERVER CARD                                       */}
        {/* ========================================================================= */}
        {step === 4 && (
          <div className="space-y-8 max-w-2xl mx-auto text-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-300 mb-4">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Configuration Complete</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Your Server Blueprint is Ready!
              </h2>
              <p className="text-slate-300 text-sm sm:text-base mt-2">
                Download your blueprint JSON and launch it directly in the Minenager Desktop App.
              </p>
            </div>

            {/* Final Server Instance Card */}
            <div className="p-8 sm:p-10 rounded-3xl bg-card-glass border-2 border-cyan-400 text-left relative glow-primary space-y-6 shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse"></span>
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-cyan-300">
                    Ready to Launch
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-400">
                  {loader} {version}
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={serverName}
                  onChange={(e) => setServerName(e.target.value)}
                  className="bg-transparent text-2xl sm:text-3xl font-extrabold text-white font-mono w-full focus:outline-none focus:border-b border-cyan-400"
                />
                <input
                  type="text"
                  value={motd}
                  onChange={(e) => setMotd(e.target.value)}
                  className="bg-transparent text-sm text-slate-300 font-mono w-full focus:outline-none mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-black/50 border border-white/5 font-mono text-xs sm:text-sm text-slate-300">
                <div>RAM: <strong className="text-cyan-400">{ramGb} GB</strong></div>
                <div>Mods: <strong className="text-white">{selectedMods.size} Installed</strong></div>
                <div>Slots: <strong className="text-white">{maxPlayers} Players</strong></div>
                <div>Crossplay: <strong className={enableGeyser ? "text-cyan-400" : "text-slate-500"}>{enableGeyser ? "GeyserMC" : "Java Only"}</strong></div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleExportBlueprint}
                  className="flex-1 py-4 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm sm:text-base flex items-center justify-center gap-2.5 transition glow-primary"
                >
                  {exportFeedback ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Blueprint Downloaded!</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>Download Blueprint JSON</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopyJson}
                  className="py-4 px-5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-sm font-bold flex items-center justify-center gap-2 transition border border-white/10"
                >
                  {copiedJson ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Desktop App Launch Guide */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-left font-mono text-xs text-slate-300 space-y-2">
              <div className="font-bold text-cyan-400 text-sm mb-1">How to launch:</div>
              <div>1. Open your <strong>Minenager Desktop App</strong>.</div>
              <div>2. Drag &amp; drop the exported <code>.json</code> file into the app window.</div>
              <div>3. Click <strong>Start Server</strong> — Minenager downloads mods &amp; boots everything automatically.</div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={() => setStep(1)}
                className="text-xs font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Start New Configuration
              </button>
            </div>
          </div>
        )}

      </div>

      <Footer />
    </main>
  );
}
