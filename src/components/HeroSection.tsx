"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Download,
  CheckCircle2,
  Terminal,
  Layers,
  Activity,
} from "lucide-react";

interface TabItem {
  id: string;
  name: string;
  badge: string;
  imageSrc: string;
  icon: any;
}

export default function HeroSection() {
  const tabs: TabItem[] = [
    {
      id: "console",
      name: "Console Engine",
      badge: "LIVE LOGS",
      imageSrc: "/images/preview-console.png",
      icon: Terminal,
    },
    {
      id: "mods",
      name: "Modrinth & Hangar",
      badge: "1-CLICK INSTALL",
      imageSrc: "/images/preview-mods.png",
      icon: Layers,
    },
    {
      id: "metrics",
      name: "Resource Diagnostics",
      badge: "20.0 TPS MONITOR",
      imageSrc: "/images/preview-metrics.png",
      icon: Activity,
    },
  ];

  const [activeTabId, setActiveTabId] = useState("mods");
  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[1];

  return (
    <header id="hero" className="relative overflow-hidden pt-28 pb-16 lg:pt-36 lg:pb-24 bg-transparent">
      {/* Soft Ambient Radial Light Glow behind Hero */}
      <div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[700px] sm:w-[950px] h-[450px] bg-cyan-500/[0.08] blur-[140px] rounded-full z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* LEFT SIDE: Copy & Value Proposition (5 Columns) */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] font-mono">
              BUILD IT. <br />
              <span className="text-cyan-400">OWN IT.</span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg">
              The easiest way to run your own Minecraft server. Choose your version, add mods with one click, and host straight from your computer—no technical knowledge or coding needed.
            </p>

            {/* CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
              <a
                href="#download"
                className="inline-flex px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold font-mono text-xs sm:text-sm items-center justify-center gap-2 transition text-center shadow-lg hover:shadow-cyan-500/20 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Server Engine</span>
              </a>

              <a
                href="/build"
                className="inline-flex px-6 py-3.5 rounded-xl bg-[#0B1120] hover:bg-[#0e172a] text-white font-mono font-bold text-xs sm:text-sm items-center justify-center gap-2 transition text-center border border-white/15 hover:border-white/30 cursor-pointer"
              >
                <span>Launch Web Builder &rarr;</span>
              </a>
            </div>

            {/* Trust Checkmarks */}
            <div className="pt-6 space-y-2.5 font-mono text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Zero Port Forwarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>Modrinth &amp; Hangar</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>1-Click Safe Backups</span>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: TABBED INTERACTIVE CAROUSEL (7 Columns) */}
          <div className="lg:col-span-7 w-full flex flex-col gap-3.5">
            {/* Main Screenshot Stage Display */}
            <div className="relative w-full aspect-[16/10] sm:aspect-[16/9.5] rounded-2xl overflow-hidden border border-white/15 bg-[#0B1120] shadow-2xl">
              <Image
                key={activeTab.id}
                src={activeTab.imageSrc}
                alt={activeTab.name}
                fill
                priority
                className="object-cover object-top transition-all duration-300 animate-fadeIn"
              />
            </div>

            {/* Bottom 3 Interactive Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {tabs.map((tab) => {
                const isActive = activeTabId === tab.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                      isActive
                        ? "bg-cyan-500/10 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]"
                        : "bg-[#0B1120] border-white/10 hover:border-white/20 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? "text-cyan-400" : "text-slate-400"
                        }`}
                      />
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                          isActive
                            ? "bg-cyan-400 text-black font-extrabold"
                            : "bg-white/5 text-slate-400 border border-white/10"
                        }`}
                      >
                        {tab.badge}
                      </span>
                    </div>

                    <div
                      className={`text-xs font-mono font-bold truncate ${
                        isActive ? "text-white" : "text-slate-300"
                      }`}
                    >
                      {tab.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </header>
  );
}
