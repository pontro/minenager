"use client";

import { Monitor, Layers, Globe, Check, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function FeaturesComparison() {
  const nodes = [
    {
      num: "01",
      badge: "Desktop App",
      title: "Your PC is the Engine",
      subtitle: "Native Windows Desktop App",
      desc: "Runs directly on your computer. Uses 100% of your actual hardware with automated Java 21 setup, crash watcher, and 0ms local host ping.",
      highlights: [
        "Full dedicated RAM & CPU allocation",
        "Automated Java runtime management",
        "Local 1-click world snapshots",
      ],
      icon: Monitor,
    },
    {
      num: "02",
      badge: "In-Browser",
      title: "The Browser is the Cockpit",
      subtitle: "Web Builder & Mod Catalog",
      desc: "Customize and stage your server from anywhere. Query 100,000+ packages across Modrinth & Hangar with automatic dependency resolution.",
      highlights: [
        "Live Modrinth & Hangar registry",
        "Fabric, Paper, NeoForge & Forge support",
        "Exportable 1-click blueprint JSON",
      ],
      icon: Layers,
    },
    {
      num: "03",
      badge: "Cloud Relay",
      title: "Friends Connect in 1 Click",
      subtitle: "Minenager Connect Mesh",
      desc: "An encrypted outbound reverse tunnel routes incoming players directly to your PC without opening router ports or exposing your home IP.",
      highlights: [
        "Zero port forwarding or CGNAT blocks",
        "Dedicated yourname.minenager.net domain",
        "Discord bot commands (!turnon / !turnoff)",
      ],
      icon: Globe,
    },
  ];

  return (
    <section id="features" className="py-20 lg:py-28 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono uppercase">
            WHAT IS MINENAGER?
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-sans">
            Your PC is the engine. Your browser is the cockpit. A complete server ecosystem that links your local machine, in-browser mod tools, and zero-port cloud tunnels into one fluid workflow.
          </p>
        </div>

        {/* OPEN CONNECTED ARCHITECTURE FLOW (CLEAN LINE, NO NEON) */}
        <div className="relative">
          {/* Subtle horizontal connecting line exactly through icon vertical center */}
          <div className="hidden lg:block absolute top-6 left-[8%] right-[8%] h-[1px] bg-white/15 z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-10 relative z-10 items-start">
            {nodes.map((node, idx) => {
              const Icon = node.icon;

              return (
                <div key={idx} className="flex flex-col space-y-5 text-left relative">
                  {/* Top Anchor: Icon on left, Badge + Number on right, both with background covering line */}
                  <div className="relative flex items-center justify-between w-full">
                    <div className="w-12 h-12 rounded-xl bg-[#0B1120] border border-white/20 flex items-center justify-center text-cyan-400 relative z-10 shrink-0">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>

                    <div className="font-mono text-right bg-[#060913] px-3 py-1 rounded-lg border border-white/10 relative z-10">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {node.badge}
                      </div>
                      <div className="text-lg font-black text-white">
                        {node.num}
                      </div>
                    </div>
                  </div>

                  {/* Node Content (Frameless & Clean) */}
                  <div className="space-y-1.5 pt-1">
                    <h3 className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                      {node.title}
                    </h3>
                    <div className="text-xs font-mono text-cyan-400">
                      {node.subtitle}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono pt-1">
                      {node.desc}
                    </p>
                  </div>

                  {/* Highlights checklist */}
                  <ul className="space-y-2.5 pt-2 text-xs sm:text-sm font-mono text-slate-200">
                    {node.highlights.map((h, hIdx) => (
                      <li key={hIdx} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimalist Bottom Navigation Action Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Integrated Ecosystem: Desktop Engine • Web Sandbox • Cloud Mesh</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/build"
              className="text-white hover:text-cyan-300 transition flex items-center gap-1.5 font-bold"
            >
              <span>Try Web Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span>•</span>
            <Link
              href="/mods"
              className="text-white hover:text-cyan-300 transition flex items-center gap-1.5 font-bold"
            >
              <span>Browse Catalog</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
