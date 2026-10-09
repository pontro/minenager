"use client";

import { Check, X } from "lucide-react";
import Link from "next/link";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-20 lg:py-28 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white font-mono uppercase">
            HONEST, TRANSPARENT PRICING
          </h2>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            The core server engine is 100% free and open to your hardware. Upgrade only if you want public zero-port cloud tunnels and dedicated subdomains.
          </p>
        </div>

        {/* UNIFIED DUAL-ENGINE PRICING CONSOLE */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-[#0B1120] border border-white/15 shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {/* TIER 1: COMMUNITY CORE ($0) */}
            <div className="p-8 sm:p-10 flex flex-col justify-between space-y-8">
              <div className="space-y-6">
                <div>
                  <div className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Community Core
                  </div>
                  <div className="mt-3 flex items-baseline gap-1.5 font-mono">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">$0</span>
                    <span className="text-xs text-slate-400">/ forever</span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
                    Full access to the self-hosted engine for local LAN play or manual router port-forwarding.
                  </p>
                </div>

                <div className="h-px bg-white/10" />

                <ul className="space-y-3.5 text-xs sm:text-sm font-mono text-slate-200">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Full Self-Hosted Server Engine</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Unlimited RAM &amp; CPU Hardware</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>1-Click Modrinth &amp; Hangar Manager</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>1-Click Safe World Backups</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>Requires Manual Router Port Forwarding</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <a
                  href="#download"
                  className="block w-full py-3.5 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs sm:text-sm transition border border-white/15 cursor-pointer"
                >
                  Download Free Server Engine
                </a>
              </div>
            </div>

            {/* TIER 2: MINENAGER CONNECT ($2.50) */}
            <div className="relative p-8 sm:p-10 flex flex-col justify-between space-y-8 bg-cyan-500/[0.02]">
              {/* Active Cyan Left Marker Line */}
              <span className="hidden md:block absolute left-0 top-8 bottom-8 w-[3px] rounded-r bg-cyan-400" />

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Minenager Connect
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-cyan-400 text-black font-mono font-extrabold text-[10px] uppercase tracking-wider">
                      Recommended
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-1.5 font-mono">
                    <span className="text-4xl sm:text-5xl font-extrabold text-cyan-300">$2.50</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed font-mono">
                    Zero router configuration. Public encrypted cloud tunnels, custom domain names, and remote Discord controls.
                  </p>
                </div>

                <div className="h-px bg-white/10" />

                <ul className="space-y-3.5 text-xs sm:text-sm font-mono text-white">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-cyan-300">All Free Engine Features Included</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Zero Port-Forwarding Tunnel</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">yourname.minenager.net</strong> Dedicated Domain
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-white">Discord Bot Integration</strong> (<code>!turnon</code> / <code>!turnoff</code>)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Home IP &amp; DDoS Shield (Full Privacy)</span>
                  </li>
                </ul>
              </div>

              <div className="pt-2">
                <Link
                  href="/upgrade"
                  className="block w-full py-3.5 text-center rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold font-mono text-xs sm:text-sm transition cursor-pointer shadow-lg hover:shadow-cyan-500/20"
                >
                  Get Minenager Connect ($2.50) &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
