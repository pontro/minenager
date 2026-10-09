"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Monitor, Check, ArrowRight } from "lucide-react";

export default function DownloadSection() {
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);

  const handleDownload = (platform: string) => {
    setDownloadingPlatform(platform);
    setTimeout(() => setDownloadingPlatform(null), 3000);
  };

  const steps = [
    {
      num: "01",
      title: "Install Engine",
      desc: "Double-click the installer on your PC. Automatically packages Java 21 with zero terminal setup.",
    },
    {
      num: "02",
      title: "Stage Mods & Engine",
      desc: "Select Minecraft version and mods in-app, or drop in blueprints from the Web Builder.",
    },
    {
      num: "03",
      title: "Boot & Play",
      desc: "Your server launches immediately for local play, or routes through cloud tunnels for friends.",
    },
  ];

  return (
    <section id="download" className="py-20 lg:py-28 bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono uppercase">
            DOWNLOAD SERVER ENGINE
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            No coding, no terminal, and no complicated router setup. Start your self-hosted Minecraft server in under 60 seconds.
          </p>
        </div>

        {/* 3-Step Connected Flowline Track */}
        <div className="relative">
          {/* Subtle horizontal connecting line exactly through step circle center */}
          <div className="hidden md:block absolute top-6 left-[16%] right-[16%] h-[1px] bg-white/15 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10 text-center">
            {steps.map((s, idx) => (
              <div key={idx} className="flex flex-col items-center space-y-3 px-4">
                <div className="w-12 h-12 rounded-2xl bg-[#0B1120] border border-white/20 flex items-center justify-center font-mono font-extrabold text-sm text-cyan-300 relative z-10">
                  {s.num}
                </div>
                <h3 className="text-lg font-extrabold text-white font-mono">
                  {s.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-mono max-w-xs">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Streamlined Launcher Download Console */}
        <div className="max-w-3xl mx-auto p-8 sm:p-10 rounded-3xl bg-[#0B1120] border border-white/15 shadow-2xl space-y-6 text-center">
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Monitor className="w-4 h-4" />
              <span>Direct Desktop Installer</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
              Minenager Server Engine v1.0.4
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-lg mx-auto">
              Native desktop build for 64-bit Windows. Bundled with automated server runtime management.
            </p>
          </div>

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={() => handleDownload("Windows")}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold font-mono text-sm flex items-center justify-center gap-2.5 transition shadow-lg hover:shadow-cyan-500/25 cursor-pointer"
            >
              {downloadingPlatform === "Windows" ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Downloading .exe...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download for Windows (.exe)</span>
                </>
              )}
            </button>

            <Link
              href="/build"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-[#060a14] hover:bg-[#080f20] text-white font-bold font-mono text-sm border border-white/15 hover:border-white/30 transition flex items-center justify-center gap-2"
            >
              <span>Stage in Web Builder</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Technical Specs Strip */}
          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 font-mono text-xs text-slate-400">
            <span>Windows 10 / 11 (64-bit)</span>
            <span>•</span>
            <span>Java 21 Runtime Included</span>
            <span>•</span>
            <span>Free Community License</span>
          </div>
        </div>
      </div>
    </section>
  );
}
