"use client";

import { useState } from "react";
import Image from "next/image";
import { Download, CheckCircle2, Terminal, Layers, Activity } from "lucide-react";

interface ParallelogramPhotoSlice {
  id: string;
  title: string;
  category: string;
  badge: string;
  imageSrc: string;
  textColor: string;
  icon: typeof Terminal;
}

export default function HeroSection() {
  const [activeSlice, setActiveSlice] = useState<string>("console");

  const slices: ParallelogramPhotoSlice[] = [
    {
      id: "console",
      title: "Real-Time Terminal",
      category: "Console Engine",
      badge: "LIVE LOGS",
      imageSrc: "/images/preview-console.png",
      textColor: "text-cyan-400",
      icon: Terminal,
    },
    {
      id: "mods",
      title: "Mod & Plugin Store",
      category: "Modrinth & Hangar",
      badge: "1-CLICK INSTALL",
      imageSrc: "/images/preview-mods.png",
      textColor: "text-emerald-400",
      icon: Layers,
    },
    {
      id: "metrics",
      title: "Performance Monitor",
      category: "Resource Diagnostics",
      badge: "20.0 TPS MONITOR",
      imageSrc: "/images/preview-metrics.png",
      textColor: "text-cyan-300",
      icon: Activity,
    },
  ];

  return (
    <header id="hero" className="relative overflow-hidden py-10 lg:py-16 border-b border-white/5 bg-[#060913]">
      {/* Static Non-Moving Hero Section Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <Image
          src="/images/hero-bg.png"
          alt="Atmospheric Minecraft Underwater Background"
          fill
          priority
          unoptimized
          className="object-cover object-top opacity-80 blur-[2px] scale-105"
        />
        {/* Smooth Gradient Overlays: dark top for navbar contrast & smooth bottom fade into rest of page */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#060913]/30 via-transparent to-[#060913]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        
        {/* UNIFIED FULL-WIDTH BIG CARD MODAL CONTAINER */}
        <div className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-card-glass border border-white/10 shadow-2xl backdrop-blur-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* LEFT SIDE: Copy & Value Proposition (4 Columns - more compact) */}
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

            {/* EXPANDED RIGHT SIDE: THE DIAGONAL PARALLELOGRAM PHOTO CAROUSEL (8 Columns - wide & prominent) */}
            <div className="lg:col-span-8 w-full flex justify-center items-center py-2">
              {/* Outer Skewed Parent Frame */}
              <div
                className="w-full h-[420px] sm:h-[480px] lg:h-[520px] rounded-3xl overflow-hidden border-2 border-black/80 flex shadow-2xl relative select-none -skew-x-[8deg] bg-black/80"
              >
                {slices.map((slice) => {
                  const isOpen = activeSlice === slice.id;
                  const Icon = slice.icon;

                  return (
                    <button
                      key={slice.id}
                      type="button"
                      onClick={() => setActiveSlice(slice.id)}
                      className={`relative h-full transition-all duration-500 ease-out cursor-pointer overflow-hidden border-r-2 border-black/80 last:border-r-0 ${
                        isOpen
                          ? "flex-[8.5] z-10 opacity-100"
                          : "flex-[1] z-0 hover:flex-[1.4] opacity-80 hover:opacity-100"
                      }`}
                    >
                      {/* Photo Background Layer with Un-skew to Keep Screenshot Crisp */}
                      <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#060913]">
                        <div className="skew-x-[8deg] scale-125 w-full h-full relative">
                          <Image
                            src={slice.imageSrc}
                            alt={slice.title}
                            fill
                            className="object-cover object-top"
                            unoptimized
                          />
                          {/* Soft overlay on inactive slices */}
                          <div
                            className={`absolute inset-0 transition-opacity duration-300 ${
                              isOpen
                                ? "bg-gradient-to-t from-black/70 via-transparent to-transparent"
                                : "bg-black/60 hover:bg-black/40"
                            }`}
                          />
                        </div>
                      </div>

                      {/* Foreground UI Controls & Titles (Straightened) */}
                      <div className="relative z-10 skew-x-[8deg] w-full h-full flex flex-col justify-between p-4 sm:p-5">
                        {/* Top Bar inside the Photo */}
                        <div className="flex items-center justify-start w-full">
                          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/60 border border-white/15 backdrop-blur-md flex items-center justify-center shrink-0 text-white ml-3 sm:ml-4 shadow-lg">
                            <Icon className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Title Display */}
                        {isOpen ? (
                          <div className="text-left font-mono mt-auto mb-2 pl-3 animate-fadeIn space-y-1">
                            <div className="text-xs uppercase text-cyan-300 font-bold tracking-wider drop-shadow-md">
                              {slice.category}
                            </div>
                            <div className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-lg">
                              {slice.title}
                            </div>
                          </div>
                        ) : (
                          <div className="my-auto mx-auto flex items-center justify-center">
                            <span className="writing-vertical font-mono text-xs font-bold uppercase tracking-wider rotate-180 text-white/90 bg-black/60 px-2 py-3 rounded-lg border border-white/15 backdrop-blur-md">
                              {slice.category}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

      </div>
    </header>
  );
}
