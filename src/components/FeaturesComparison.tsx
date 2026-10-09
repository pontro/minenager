import { XCircle, X, CheckCircle, Check } from "lucide-react";

export default function FeaturesComparison() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Why Selfhost Using Minenager?
          </h2>
          <p className="mt-3.5 text-slate-300 text-base sm:text-lg">
            Compare traditional paid host limitations against hosting on your own computer with our free server-engine.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          {/* The Old Way (Paid Shared Hosts) */}
          <div className="p-8 sm:p-10 rounded-2xl bg-black/50 border border-red-500/25 text-left flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-red-400 font-mono text-sm font-bold uppercase tracking-wider mb-4">
                <XCircle className="w-5 h-5" /> Traditional Server Hosts
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                Expensive, Slow &amp; Confusing
              </h3>
              <ul className="space-y-5 text-sm sm:text-base text-slate-300">
                <li className="flex items-start gap-3.5">
                  <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span><strong>$20–$30/month</strong> for bare minimum 4GB RAM on crowded, laggy shared server CPUs.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>Confusing control panels with strict, artificial player slot limits and memory caps.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>Manual file uploads (FTP) with zero automated dependency or mod crash resolution.</span>
                </li>
                <li className="flex items-start gap-3.5">
                  <X className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span>Extra hidden monthly fees for automatic world backups and database storage.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* The Minenager Way */}
          <div className="p-8 sm:p-10 rounded-2xl bg-card-glass border border-cyan-500/40 text-left relative overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm font-bold uppercase tracking-wider mb-4">
                <CheckCircle className="w-5 h-5" /> The Minenager Server Engine
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-6">
                100% Free, 1-Click &amp; Unlimited
              </h3>
              <ul className="space-y-5 text-sm sm:text-base text-white">
                <li className="flex items-start gap-3.5">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-cyan-300">100% Free Server Engine</strong>: Use all of your computer&apos;s RAM &amp; CPU with zero artificial limits or monthly hosting bills.
                  </span>
                </li>
                <li className="flex items-start gap-3.5">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-cyan-300">1-Click Mod Manager</strong>: Search and add mods directly from Modrinth &amp; Hangar without touching files.
                  </span>
                </li>
                <li className="flex items-start gap-3.5">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-cyan-300">Local World Backups</strong>: Create instant 1-click backup snapshots on your own hard drive before testing new mods.
                  </span>
                </li>
                <li className="flex items-start gap-3.5">
                  <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-cyan-300">Integrated Player &amp; Server Controls</strong>: Start, stop, OP players, manage whitelists, and view live logs with ease.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
