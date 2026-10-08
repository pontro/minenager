"use client";

import { useState } from "react";
import { Download, Monitor, Check, Sparkles } from "lucide-react";

export default function DownloadSection() {
  const [downloadingPlatform, setDownloadingPlatform] = useState<string | null>(null);

  const handleDownload = (platform: string) => {
    setDownloadingPlatform(platform);
    setTimeout(() => setDownloadingPlatform(null), 3000);
  };

  return (
    <section id="download" className="py-24 border-b border-white/5 bg-black/40">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs sm:text-sm font-mono text-cyan-300 mb-5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Zero Configuration Required</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
          Download the Server Engine
        </h2>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-12 leading-relaxed">
          No coding, no terminal, and no complicated setup. Just install the server engine, pick your version, and start your Minecraft server in under 60 seconds.
        </p>

        {/* Platform Download Card - Windows Centered */}
        <div className="max-w-md mx-auto text-left">
          {/* Windows */}
          <div className="p-8 sm:p-9 rounded-2xl bg-card-glass border border-cyan-500/40 flex flex-col justify-between relative">
            <div className="absolute -top-3.5 right-6 px-3 py-1 rounded-full bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider">
              Windows (64-bit)
            </div>
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-5">
                <Monitor className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl sm:text-2xl text-white">Minenager Engine</h3>
              <p className="text-sm sm:text-base text-slate-300 mt-1.5">Windows 10 / 11 (64-bit)</p>
              <div className="text-xs sm:text-sm font-mono text-cyan-300 mt-4">
                Automatic Java runtime setup included
              </div>
            </div>
            <button
              onClick={() => handleDownload("Windows")}
              className="mt-8 w-full py-4 px-5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm sm:text-base flex items-center justify-center gap-2.5 transition cursor-pointer"
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
          </div>
        </div>

        {/* How it works 3-Step Simple Guide - Enlarged & Highly Readable */}
        <div className="mt-16 pt-12 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center max-w-4xl mx-auto">
          <div className="p-6 sm:p-7 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-base mb-4">
              1
            </div>
            <div className="text-cyan-400 font-bold text-base sm:text-lg mb-2 font-mono">
              Download &amp; Open
            </div>
            <span className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Double-click the installer on your PC. Zero technical setup.
            </span>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-base mb-4">
              2
            </div>
            <div className="text-cyan-400 font-bold text-base sm:text-lg mb-2 font-mono">
              Pick Mods &amp; Version
            </div>
            <span className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Choose your settings or drop your exported blueprint JSON right in.
            </span>
          </div>

          <div className="p-6 sm:p-7 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold font-mono text-base mb-4">
              3
            </div>
            <div className="text-cyan-400 font-bold text-base sm:text-lg mb-2 font-mono">
              Click Start
            </div>
            <span className="text-sm sm:text-base text-slate-300 leading-relaxed">
              Your server boots instantly and is ready for friends to join.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
