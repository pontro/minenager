"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import {
  User,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Download,
  LogOut,
  ArrowRight,
  ExternalLink,
  Loader2
} from "lucide-react";

export default function PortalPage() {
  const router = useRouter();
  const { user, isLoading, logout } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/portal");
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <main className="min-h-screen flex flex-col bg-[#060913]">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
        </div>
        <Footer />
      </main>
    );
  }

  const isPro = user.tier === "pro";

  return (
    <main className="min-h-screen flex flex-col bg-[#060913] relative overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        {/* Profile Top Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 glow-primary mb-8 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-mono font-bold text-xl glow-primary">
              {user.username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-mono">{user.username}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase ${
                    isPro
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                      : "bg-zinc-800 text-zinc-300 border border-zinc-700"
                  }`}
                >
                  {isPro ? "PRO" : "FREE"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {!isPro && (
              <Link
                href="/upgrade"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-xs flex items-center justify-center gap-2 glow-primary transition"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Upgrade Plan ($2.50)</span>
              </Link>
            )}
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-mono text-xs flex items-center justify-center gap-2 border border-white/10 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Status Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Plan &amp; License
                </span>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isPro ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
                  }`}
                ></span>
              </div>

              <h2 className="text-xl font-bold text-white font-mono mb-2">
                {isPro ? "Minenager Pro Subscription" : "Community Free Plan"}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                {isPro
                  ? "Your Pro subscription is active. All zero-portforward game tunnels and Discord bot remote controls are unlocked."
                  : "You are currently on the free plan. Upgrade to unlock zero-portforward game tunnels so your friends can connect directly."}
              </p>

              <div className="space-y-3 font-mono text-xs text-slate-300 border-t border-white/10 pt-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Price:</span>
                  <span className="text-white font-bold">{isPro ? "$2.50 / month" : "$0 / forever"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reverse Tunnels:</span>
                  <span className={isPro ? "text-cyan-400 font-bold" : "text-slate-500"}>
                    {isPro ? "Enabled (Unlimited)" : "Disabled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Discord Bot Integration:</span>
                  <span className={isPro ? "text-cyan-400 font-bold" : "text-slate-500"}>
                    {isPro ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10">
              {isPro ? (
                <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Subscribed &amp; Verified</span>
                </div>
              ) : (
                <Link
                  href="/upgrade"
                  className="block w-full py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-xs text-center glow-primary transition"
                >
                  Upgrade to Pro ($2.50/mo) &rarr;
                </Link>
              )}
            </div>
          </div>

          {/* Connected Tunnel & Subdomain Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Game Tunnel Configuration
                </span>
                <Globe className="w-4 h-4 text-cyan-400" />
              </div>

              <h2 className="text-xl font-bold text-white font-mono mb-2">Zero-Port Multiplayer</h2>
              <p className="text-sm text-slate-300 leading-relaxed mb-6">
                Your dedicated Minecraft domain address synced with the desktop app.
              </p>

              <div className="p-4 rounded-xl bg-black/50 border border-white/10 mb-4">
                <div className="text-xs text-slate-400 font-mono mb-1">Your Zero-Port Domain:</div>
                <div className="text-sm font-mono font-bold text-cyan-300 break-all flex items-center justify-between gap-2">
                  <span>{user.username}.minenager.net</span>
                  {isPro && (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      LIVE
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <p>
                  To link your server, open the <strong>Minenager Desktop App</strong>, open the Account modal from the bottom left, and log in with your credentials.
                </p>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/10">
              <a
                href="/#download"
                className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs flex items-center justify-center gap-2 border border-white/10 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Desktop App</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
