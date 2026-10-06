"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { createCheckoutSession } from "@/lib/api";
import {
  Check,
  Zap,
  ShieldCheck,
  Globe,
  Radio,
  Server,
  Loader2,
  AlertCircle,
  ExternalLink,
  ArrowRight
} from "lucide-react";

export default function UpgradePage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleStartCheckout = async () => {
    if (!user || !token) {
      router.push("/login?redirect=/upgrade");
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const { client_secret } = await createCheckoutSession(token);
      // In embedded/redirect Stripe mode, redirect or initialize embedded form
      // If Stripe returns client_secret, we can direct or alert for live key
      alert(`Stripe Checkout session initialized for ${user.email}! (Session Secret: ${client_secret.slice(0, 15)}...)`);
    } catch (err: any) {
      setCheckoutError(err.message || "Could not launch Stripe checkout.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#060913] relative overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-5xl mx-auto px-6 py-16 w-full flex flex-col justify-center">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-xs font-mono text-cyan-300 mb-4 glow-primary">
            <Zap className="w-3.5 h-3.5" />
            <span>Minenager Pro Upgrade</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
            Host with <span className="text-cyan-400">Zero Port-Forwarding</span>
          </h1>
          <p className="mt-4 text-slate-300 text-base sm:text-lg">
            Upgrade your Minenager account to instantly unlock public game tunnels, Discord bot controls, and custom zero-port domain addresses.
          </p>
        </div>

        {/* Error Alert */}
        {checkoutError && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-sm text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Plan Card */}
        <div className="max-w-xl mx-auto w-full p-8 sm:p-10 rounded-2xl bg-card-glass border-2 border-cyan-400 glow-primary-lg relative">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-cyan-400 text-black font-mono font-bold text-xs uppercase tracking-wider">
            Simple Pricing
          </div>

          <div className="flex flex-col sm:flex-row items-baseline justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-mono flex items-center gap-2">
                <span>Minenager Pro</span>
                <span className="px-2 py-0.5 text-xs rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  ALL-IN-ONE
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Zero router configuration, multiplayer ready in 1 click.
              </p>
            </div>
            <div className="flex items-baseline gap-1 font-mono">
              <span className="text-4xl sm:text-5xl font-extrabold text-white">$2.50</span>
              <span className="text-sm text-slate-400">/ mo</span>
            </div>
          </div>

          {/* Feature List */}
          <ul className="mt-8 space-y-4 text-sm sm:text-base text-white">
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Zero Port-Forwarding Reverse Tunnel</strong>: Friends can join your server directly without touching router settings.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Custom Zero-Port Domain</strong> (<code>yourname.minenager.net</code>): No need to type tricky port numbers.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Discord Bot Integration</strong>: Control your server with <code>!turnon</code>, <code>!turnoff</code>, and real-time alerts.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Instant Activation</strong>: Changes sync automatically with your desktop app.
              </span>
            </li>
          </ul>

          {/* User state and CTA */}
          <div className="mt-10 pt-6 border-t border-white/10">
            {isLoading ? (
              <div className="py-4 text-center text-slate-400 font-mono text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Checking account status...</span>
              </div>
            ) : user?.tier === "pro" ? (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                <div className="text-emerald-400 font-mono font-bold text-sm flex items-center justify-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Minenager Pro is Active!</span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Logged in as <strong className="text-white">{user.username}</strong> ({user.email}). Tunnels and Discord features are unlocked on your desktop app.
                </p>
                <Link
                  href="/portal"
                  className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs transition"
                >
                  <span>Go to Account Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : user ? (
              <div>
                <div className="mb-4 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Upgrading account: <strong className="text-white">{user.username}</strong></span>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Current: FREE</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-bold font-mono text-base transition flex items-center justify-center gap-2 glow-primary shadow-lg cursor-pointer"
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Opening Secure Checkout...</span>
                    </>
                  ) : (
                    <>
                      <span>Upgrade to Pro Now ($2.50/mo)</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-4 text-xs text-slate-400 text-center font-mono">
                  Sign in or create a free account to link your subscription.
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/login?redirect=/upgrade"
                    className="flex-1 py-3.5 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-sm transition border border-white/10"
                  >
                    Sign In First
                  </Link>
                  <Link
                    href="/login?mode=register&redirect=/upgrade"
                    className="flex-1 py-3.5 text-center rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-sm transition glow-primary"
                  >
                    Create Account &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
