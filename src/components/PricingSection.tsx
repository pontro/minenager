import { Check, X } from "lucide-react";

export default function PricingSection() {
  return (
    <section id="pricing" className="py-24 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Honest, Transparent Pricing
          </h2>
          <p className="mt-3.5 text-slate-300 text-base sm:text-lg">
            100% Free Desktop App forever. Pay only if you want instant zero-port-forwarding cloud tunnels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Tier 1: Free Community */}
          <div className="p-8 sm:p-9 rounded-2xl bg-card-glass border border-white/10 flex flex-col justify-between">
            <div>
              <div className="font-mono text-sm font-bold text-slate-400 uppercase tracking-wider">
                Community Core
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold text-white font-mono">$0</span>
                <span className="text-sm font-mono text-slate-400">/ forever</span>
              </div>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Full access to the desktop server app and web builder for local LAN or manual port forwarding.
              </p>

              <ul className="mt-8 space-y-4 text-sm sm:text-base text-white">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Full Desktop Server App</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>Unlimited RAM &amp; CPU Usage</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>1-Click Modrinth &amp; Hangar Manager</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>1-Click Safe World Backups</span>
                </li>
                <li className="flex items-start gap-3 text-slate-500">
                  <X className="w-5 h-5 text-zinc-600 shrink-0 mt-0.5" />
                  <span>No Zero-Config Cloud Tunnel</span>
                </li>
              </ul>
            </div>

            <a
              href="#download"
              className="mt-10 block w-full py-3.5 sm:py-4 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold font-mono text-sm sm:text-base transition border border-white/10"
            >
              Download Free Desktop App
            </a>
          </div>

          {/* Tier 2: Connect Starter (Featured) */}
          <div className="p-8 sm:p-9 rounded-2xl bg-card-glass border-2 border-cyan-400 flex flex-col justify-between relative glow-primary">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider">
              Most Popular
            </div>
            <div>
              <div className="font-mono text-sm font-bold text-cyan-400 uppercase tracking-wider">
                Minenager Connect
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold text-white font-mono">$2.50</span>
                <span className="text-sm font-mono text-slate-400">/ month</span>
              </div>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                Play with friends without touching your router. Zero port forwarding, custom domain, and DDoS protection.
              </p>

              <ul className="mt-8 space-y-4 text-sm sm:text-base text-white">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>All Free Features Included</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Zero Port Forwarding Tunnel</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>yourname.minenager.link</strong> Domain</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>10 GB Encrypted Cloud Backups</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>100% Ad-Free Experience</span>
                </li>
              </ul>
            </div>

            <a
              href="/upgrade"
              className="mt-10 block w-full py-3.5 sm:py-4 text-center rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm sm:text-base transition glow-primary"
            >
              Get Minenager Pro ($2.50) &rarr;
            </a>
          </div>

          {/* Tier 3: Connect Pro */}
          <div className="p-8 sm:p-9 rounded-2xl bg-card-glass border border-white/10 flex flex-col justify-between">
            <div>
              <div className="font-mono text-sm font-bold text-amber-400 uppercase tracking-wider">
                Connect Pro
              </div>
              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-5xl font-extrabold text-white font-mono">$4.00</span>
                <span className="text-sm font-mono text-slate-400">/ month</span>
              </div>
              <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                For active communities wanting custom apex domains, high-bandwidth edge routing, and cloud diagnostics.
              </p>

              <ul className="mt-8 space-y-4 text-sm sm:text-base text-white">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Custom Domain (e.g. <span className="text-amber-300 font-mono">mc.yourserver.com</span>)</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>3 Public Active Tunnel Servers</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>50 GB Encrypted Cloud Backups</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>AI Crash Doctor &amp; Diagnostics</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <span>Priority Global Edge Routing</span>
                </li>
              </ul>
            </div>

            <button className="mt-10 block w-full py-3.5 sm:py-4 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold font-mono text-sm sm:text-base transition border border-white/10">
              Get Connect Pro
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
