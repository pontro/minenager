"use client";

import Image from "next/image";
import { Download, CheckCircle2, Terminal, Layers, Activity } from "lucide-react";
import FlexCarousel, { FlexItem } from "@/components/ui/react-bits/FlexCarousel";

export default function HeroSection() {
  const flexItems: FlexItem[] = [
    {
      id: "console",
      title: "Real-Time Terminal",
      category: "Console Engine",
      imageSrc: "/images/preview-console.png",
      tagColor: "text-cyan-400",
      icon: Terminal,
    },
    {
      id: "mods",
      title: "Mod & Plugin Store",
      category: "Modrinth & Hangar",
      imageSrc: "/images/preview-mods.png",
      tagColor: "text-emerald-400",
      icon: Layers,
    },
    {
      id: "metrics",
      title: "Performance Monitor",
      category: "Resource Diagnostics",
      imageSrc: "/images/preview-metrics.png",
      tagColor: "text-cyan-300",
      icon: Activity,
    },
  ];

  return (
    <header id="hero" className="relative overflow-hidden pt-24 pb-12 lg:pt-28 lg:pb-16 bg-transparent">
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* UNIFIED FULL-WIDTH BIG CARD MODAL CONTAINER */}
        <div className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-[#0B1120] border border-white/15 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT SIDE: Copy & Value Proposition (4 Columns) */}
            <div className="lg:col-span-4 space-y-6 text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Build it. <span className="text-cyan-400">Own it.</span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                The easiest way to run your own Minecraft server. Choose your version, add mods with one click, and host straight from your computer—no technical knowledge or coding needed.
              </p>

              {/* CTAs */}
              <div className="pt-1">
                <a
                  href="#download"
                  className="inline-flex px-7 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm items-center justify-center gap-2 transition text-center shadow-lg hover:shadow-cyan-500/20"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Server Engine</span>
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-slate-300">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>No Port Forwarding</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>Modrinth &amp; Hangar</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>1-Click Safe Backups</span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDE: REACT BITS ACCORDION GALLERY / FLEX CAROUSEL (8 Columns) */}
            <div className="lg:col-span-8 w-full flex justify-center items-center">
              <FlexCarousel items={flexItems} defaultActiveId="console" />
            </div>

          </div>
        </div>

      </div>
    </header>
  );
}
