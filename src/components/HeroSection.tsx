import { Download, ShieldCheck, CheckCircle2 } from "lucide-react";
import SandboxBuilder from "./SandboxBuilder";

export default function HeroSection() {
  return (
    <header
      id="builder-sandbox"
      className="relative overflow-hidden hero-glow-bg py-16 lg:py-24 border-b border-white/5"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-5 space-y-7 text-left">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs sm:text-sm font-mono text-cyan-300">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>100% Free Desktop App</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Build it. <span className="text-cyan-400">Own it.</span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed">
              The easiest way to run your own Minecraft server. Choose your version, add mods with one click, and host straight from your computer—no technical knowledge or coding needed.
            </p>

            {/* CTAs - Enlarged & Highly Readable */}
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <a
                href="#download"
                className="px-7 py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 transition glow-primary"
              >
                <Download className="w-5 h-5" />
                <span>Download Desktop App</span>
              </a>
              <a
                href="#pricing"
                className="px-6 py-4 rounded-xl bg-card-glass hover:bg-white/10 text-white font-mono text-sm sm:text-base border border-white/10 flex items-center justify-center gap-2.5 transition"
              >
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                <span>Connect Tunnels (No Port Forward)</span>
              </a>
            </div>

            {/* Trust Badges: Enlarged, readable with Modrinth & Hangar */}
            <div className="pt-8 border-t border-white/10 flex flex-wrap items-center gap-x-7 gap-y-4 font-mono text-sm sm:text-base text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>No Port Forwarding</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>Modrinth &amp; Hangar</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>1-Click Safe Backups</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Sandbox Configurator */}
          <div className="lg:col-span-7">
            <SandboxBuilder />
          </div>
        </div>
      </div>
    </header>
  );
}
