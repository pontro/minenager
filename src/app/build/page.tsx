"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Squares from "@/components/ui/react-bits/Squares";
import LineSidebar from "@/components/ui/react-bits/LineSidebar";
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
          limit: "20",
        });
        const res = await fetch(`/api/builder/mods?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          const list: ModItem[] = (data.mods || []).slice(0, 20);
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
    <main className="min-h-screen flex flex-col bg-[#060913] relative overflow-hidden">
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

        {/* WIZARD CONTAINER */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 lg:pt-28 flex-1 w-full flex flex-col justify-center">
          
          {/* One Big Unified Card */}
          <div className="rounded-3xl bg-[#0B1120] border border-white/15 shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[680px]">
            
            {/* Left Section: LineSidebar Navigation */}
            <aside className="w-full lg:w-72 xl:w-80 shrink-0 p-6 sm:p-8 lg:border-r lg:border-b-0 border-b border-white/15 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-white/10">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
                    Builder Steps
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {step} / 4
                  </span>
                </div>
                
                <LineSidebar
                  items={[
                    "Core Engine",
                    "Add Mods",
                    "Server Hardware",
                    "Review & Deploy",
                  ]}
                  active={step - 1}
                  onItemClick={(index) => setStep(index + 1)}
                  accentColor="#06B6D4"
                  textColor="#94A3B8"
                  markerColor="#475569"
                  showIndex={true}
                  showMarker={true}
                  proximityRadius={80}
                  maxShift={18}
                  markerLength={38}
                  itemGap={22}
                  fontSize={0.95}
                />
              </div>

              {/* Bottom Setup Summary in Sidebar */}
              <div className="hidden lg:block pt-6 border-t border-white/10 font-mono text-xs text-slate-400 space-y-1.5">
                <div className="text-slate-300 font-bold">Current Setup:</div>
                <div className="truncate text-cyan-300">{loader} {version}</div>
                <div className="text-slate-400">{selectedMods.size} mods • {ramGb}GB RAM</div>
              </div>
            </aside>

            {/* Right Section: Step Content */}
            <div className="flex-1 p-6 sm:p-8 lg:p-10 min-w-0 flex flex-col justify-between space-y-8">
              {/* ========================================================================= */}
              {/* STEP 1: CORE ENGINE & LOADER SELECTION                                    */}
              {/* ========================================================================= */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Top Header & Version Selector Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                        Choose Minecraft Engine
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1">
                        Select your Minecraft base version and server runtime architecture.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider">
                        Version:
                      </span>
                      <select
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        className="bg-[#0e1628] border border-white/15 rounded-xl px-3.5 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-cyan-400 cursor-pointer min-w-44"
                      >
                        {versionsList.map((v) => (
                          <option key={v} value={v} className="bg-[#0B1120] text-white">
                            {v} {v === "1.20.1" ? "(Recommended)" : v === "1.21.4" ? "(Latest)" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Minimalist Linear List of Loaders */}
                  <div className="divide-y divide-white/5 -mx-2 sm:-mx-4">
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
                    ].map((l) => {
                      const isSelected = loader === l.name;
                      return (
                        <div
                          key={l.name}
                          onClick={() => setLoader(l.name)}
                          className={`group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-4 px-4 sm:px-6 rounded-xl transition cursor-pointer ${
                            isSelected
                              ? "bg-cyan-500/[0.08] text-white"
                              : "hover:bg-white/[0.03] text-slate-300 hover:text-white"
                          }`}
                        >
                          {/* Active Left Marker Line matching LineSidebar */}
                          {isSelected && (
                            <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]" />
                          )}

                          <div className="flex items-center gap-3 min-w-48">
                            <span
                              className={`font-mono font-bold text-base transition ${
                                isSelected
                                  ? "text-cyan-300"
                                  : "text-white group-hover:text-cyan-300"
                              }`}
                            >
                              {l.name}
                            </span>
                            <span
                              className={`text-[11px] font-mono px-2 py-0.5 rounded border transition ${
                                isSelected
                                  ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/30"
                                  : "bg-white/5 text-slate-400 border-white/10 group-hover:border-white/20"
                              }`}
                            >
                              {l.badge}
                            </span>
                          </div>

                          <p
                            className={`text-xs sm:text-sm leading-relaxed sm:text-right max-w-xl transition ${
                              isSelected
                                ? "text-slate-200"
                                : "text-slate-400 group-hover:text-slate-300"
                            }`}
                          >
                            {l.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation Next */}
                  <div className="flex justify-end pt-4 border-t border-white/10">
                    <button
                      onClick={() => setStep(2)}
                      className="px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center gap-2 transition cursor-pointer shadow-lg hover:shadow-cyan-500/25"
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
              {/* Top Header & Search Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
                    <span>Add Server Mods &amp; Plugins</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      {selectedMods.size} Added
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    1-click verified server-side mods from Modrinth &amp; Hangar for {loader} {version}.
                  </p>
                </div>

                {loader.toLowerCase() !== "vanilla" && (
                  <div className="relative w-full md:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search mods..."
                      className="w-full bg-[#080d1a]/90 border border-white/15 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 transition"
                    />
                    {isLoadingMods && (
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin absolute right-3.5 top-3" />
                    )}
                  </div>
                )}
              </div>

              {/* Mod List Display */}
              {loader.toLowerCase() === "vanilla" ? (
                <div className="py-16 text-center text-sm font-mono text-slate-400 bg-[#080d1a]/60 rounded-2xl border border-white/10 px-6 max-w-xl mx-auto">
                  <Server className="w-10 h-10 text-cyan-400 mx-auto mb-3 opacity-80" />
                  <h3 className="font-bold text-base text-white">Vanilla Minecraft Engine</h3>
                  <p className="text-xs text-slate-400 mt-1.5 mb-5">
                    Vanilla runs unmodified official Mojang server code. No mods can be added.
                  </p>
                  <button
                    onClick={() => setStep(1)}
                    className="px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-xs transition cursor-pointer shadow-lg hover:shadow-cyan-500/25"
                  >
                    Switch to Fabric or NeoForge
                  </button>
                </div>
              ) : isLoadingMods && availableMods.length === 0 ? (
                <div className="py-20 text-center text-sm font-mono text-slate-400 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-7 h-7 text-cyan-400 animate-spin" />
                  <span>Finding verified server mods for {loader} {version}...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1.5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                  {availableMods.map((mod) => {
                    const isSelected = selectedMods.has(mod.id);
                    return (
                      <div
                        key={mod.id}
                        onClick={() => toggleMod(mod)}
                        className={`group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-cyan-500/[0.07] border-cyan-500/40 text-white shadow-[0_0_15px_rgba(6,182,212,0.1)]"
                            : "bg-[#080d1a]/70 border-white/10 hover:border-white/20 hover:bg-[#0c1424] text-slate-300"
                        }`}
                      >
                        {/* Active Left Marker Line matching LineSidebar & Step 1 */}
                        {isSelected && (
                          <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                        )}

                        <div className="flex items-center gap-3.5 min-w-0 pl-1">
                          {mod.iconUrl ? (
                            <img
                              src={mod.iconUrl}
                              alt={mod.name}
                              className="w-11 h-11 rounded-xl object-cover border border-white/10 bg-black/40 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xs shrink-0">
                              {mod.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 font-mono font-bold text-sm">
                              <span
                                className={`truncate transition ${
                                  isSelected
                                    ? "text-cyan-300"
                                    : "text-white group-hover:text-cyan-300"
                                }`}
                              >
                                {mod.name}
                              </span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded border shrink-0 ${getPlatformBadgeStyle(
                                  mod.platform
                                )}`}
                              >
                                {mod.platform}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 truncate mt-0.5 leading-snug">
                              {mod.description || "Verified server compatibility"}
                            </div>
                            {mod.downloads > 0 && (
                              <div className="text-[11px] font-mono text-slate-500 mt-1">
                                {(mod.downloads / 1000000).toFixed(1)}M downloads
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 pl-2">
                          {isSelected ? (
                            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30 flex items-center gap-1.5 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                              <Check className="w-3.5 h-3.5" /> Added
                            </span>
                          ) : (
                            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-white/5 group-hover:bg-white/15 text-slate-400 group-hover:text-white border border-white/10 group-hover:border-white/20 transition flex items-center gap-1.5">
                              <Plus className="w-3.5 h-3.5" /> Add
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-sm flex items-center gap-2 transition cursor-pointer border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Engine
                </button>

                <button
                  onClick={() => setStep(3)}
                  className="px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center gap-2 transition cursor-pointer shadow-lg hover:shadow-cyan-500/25"
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
            <div className="space-y-4">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    Server Hardware &amp; Rules
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Allocate RAM memory, render distance, and multiplayer gameplay settings.
                  </p>
                </div>
              </div>

              {/* Sliders Grid: RAM + View/Sim Distances */}
              <div className="space-y-3">
                {/* RAM Allocation */}
                <div className="p-4 sm:p-5 rounded-xl bg-[#080d1a]/70 border border-white/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-mono text-sm font-bold text-white">
                      <Cpu className="w-4 h-4 text-cyan-400" />
                      <span>RAM Allocation</span>
                    </div>
                    <span className="font-mono text-base font-bold text-cyan-300">
                      {ramGb} GB RAM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="24"
                    step="1"
                    value={ramGb}
                    onChange={(e) => setRamGb(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                  />
                  <div className="flex justify-between text-xs font-mono text-slate-400">
                    <span>2 GB (Min)</span>
                    <span>24 GB (Max)</span>
                  </div>
                </div>

                {/* 2-Column: View Distance & Simulation Distance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* View Distance */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#080d1a]/70 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between font-mono text-sm font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span>View Distance</span>
                      </div>
                      <span className="text-base font-bold text-cyan-300">{viewDistance} Chunks</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="32"
                      step="1"
                      value={viewDistance}
                      onChange={(e) => setViewDistance(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>4 Chunks (Min)</span>
                      <span>32 Chunks (Max)</span>
                    </div>
                  </div>

                  {/* Simulation Distance */}
                  <div className="p-4 sm:p-5 rounded-xl bg-[#080d1a]/70 border border-white/10 space-y-2.5">
                    <div className="flex items-center justify-between font-mono text-sm font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-cyan-400" />
                        <span>Simulation Distance</span>
                      </div>
                      <span className="text-base font-bold text-cyan-300">{simulationDistance} Chunks</span>
                    </div>
                    <input
                      type="range"
                      min="3"
                      max="16"
                      step="1"
                      value={simulationDistance}
                      onChange={(e) => setSimulationDistance(parseInt(e.target.value, 10))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
                    />
                    <div className="flex justify-between text-xs font-mono text-slate-400">
                      <span>3 Chunks (Min)</span>
                      <span>16 Chunks (Max)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Gameplay & World Rules Section */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#080d1a]/70 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider">
                    <Gamepad2 className="w-4 h-4" />
                    <span>Gameplay Rules</span>
                  </div>

                  <div className="flex items-center gap-5 text-xs sm:text-sm font-mono text-slate-200">
                    <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={pvp}
                        onChange={(e) => setPvp(e.target.checked)}
                        className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                      />
                      <span>Allow PvP</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:text-white transition">
                      <input
                        type="checkbox"
                        checked={hardcore}
                        onChange={(e) => setHardcore(e.target.checked)}
                        className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
                      />
                      <span>Hardcore</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 font-medium mb-1.5">
                      Difficulty
                    </label>
                    <select
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value)}
                      className="w-full bg-[#060a14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 capitalize cursor-pointer"
                    >
                      <option value="peaceful">Peaceful</option>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 font-medium mb-1.5">
                      Gamemode
                    </label>
                    <select
                      value={gamemode}
                      onChange={(e) => setGamemode(e.target.value)}
                      className="w-full bg-[#060a14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400 capitalize cursor-pointer"
                    >
                      <option value="survival">Survival</option>
                      <option value="creative">Creative</option>
                      <option value="adventure">Adventure</option>
                      <option value="spectator">Spectator</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 font-medium mb-1.5">
                      Max Players
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="500"
                      value={maxPlayers}
                      onChange={(e) => setMaxPlayers(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full bg-[#060a14] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-sm flex items-center gap-2 transition cursor-pointer border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Mods
                </button>

                <button
                  onClick={() => setStep(4)}
                  className="px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center gap-2 transition cursor-pointer shadow-lg hover:shadow-cyan-500/25"
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
            <div className="space-y-4">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
                    <span>Review &amp; Export Blueprint</span>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                      Ready to Launch
                    </span>
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1">
                    Inspect your server profile and download the 1-click launch blueprint JSON.
                  </p>
                </div>
              </div>

              {/* Server Name & MOTD Editor */}
              <div className="p-4 sm:p-5 rounded-xl bg-[#080d1a]/70 border border-white/10 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-mono text-slate-300 font-medium mb-1.5">
                      Server Instance Name
                    </label>
                    <input
                      type="text"
                      value={serverName}
                      onChange={(e) => setServerName(e.target.value)}
                      placeholder="My Minenager Server"
                      className="w-full bg-[#060a14] border border-white/15 rounded-xl px-4 py-2.5 text-sm sm:text-base font-mono font-bold text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-300 font-medium mb-1.5">
                      Server MOTD Description
                    </label>
                    <input
                      type="text"
                      value={motd}
                      onChange={(e) => setMotd(e.target.value)}
                      placeholder="A customized Minecraft server built with Minenager"
                      className="w-full bg-[#060a14] border border-white/15 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-300 focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Configuration Summary Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#060a14]/60 border border-white/10 font-mono">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Engine</div>
                    <div className="text-cyan-300 font-bold text-sm sm:text-base truncate mt-1">{loader} {version}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#060a14]/60 border border-white/10 font-mono">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Allocated RAM</div>
                    <div className="text-white font-bold text-sm sm:text-base truncate mt-1">{ramGb} GB</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#060a14]/60 border border-white/10 font-mono">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Server Mods</div>
                    <div className="text-white font-bold text-sm sm:text-base truncate mt-1">{selectedMods.size} Installed</div>
                  </div>
                  <div className="p-3 rounded-xl bg-[#060a14]/60 border border-white/10 font-mono">
                    <div className="text-xs text-slate-400 uppercase tracking-wider">Max Players</div>
                    <div className="text-white font-bold text-sm sm:text-base truncate mt-1">{maxPlayers} Slots</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleExportBlueprint}
                  className="flex-1 py-4 px-6 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm sm:text-base flex items-center justify-center gap-2.5 transition cursor-pointer shadow-lg hover:shadow-cyan-500/25"
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
                  className="py-4 px-6 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-sm sm:text-base font-bold flex items-center justify-center gap-2 transition border border-white/15 cursor-pointer"
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

              {/* Quick Launch Guide */}
              <div className="p-4 rounded-xl bg-[#080d1a]/60 border border-white/10 font-mono text-xs sm:text-sm text-slate-300 space-y-1.5">
                <div className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>How to Launch in Minenager</span>
                </div>
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  1. Open your <strong>Minenager Desktop Engine</strong>. 2. Drag &amp; drop the exported <code>.json</code> file. 3. Click <strong>Start Server</strong> to auto-install mods and boot.
                </div>
              </div>

              {/* Bottom Navigation */}
              <div className="flex justify-between items-center pt-3 border-t border-white/10">
                <button
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs sm:text-sm flex items-center gap-2 transition cursor-pointer border border-white/10"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Hardware
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="text-xs sm:text-sm font-mono text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> Start New Configuration
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>

        <Footer />
      </div>
    </main>
  );
}
