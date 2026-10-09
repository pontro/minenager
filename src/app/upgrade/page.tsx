"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Squares from "@/components/ui/react-bits/Squares";
import { useAuth } from "@/context/AuthContext";
import { createCheckoutSession } from "@/lib/api";
import {
  Check,
  ShieldCheck,
  Loader2,
  AlertCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  X,
} from "lucide-react";

export default function UpgradePage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // FAQ Accordion active states
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleStartCheckout = async () => {
    if (!user || !token) {
      router.push("/login?redirect=/upgrade");
      return;
    }

    setIsCheckingOut(true);
    setCheckoutError(null);

    try {
      const { client_secret } = await createCheckoutSession(token);
      alert(
        `Stripe Checkout initialized for ${user.email}!\n\n(Session Secret: ${client_secret.slice(
          0,
          20
        )}...)`
      );
    } catch (err: any) {
      setCheckoutError(err.message || "Could not launch Stripe checkout.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const FAQS = [
    {
      q: "Do my friends need to pay or install any software?",
      a: "No! Only the server host needs Minenager Connect. Your friends join directly in Minecraft by entering your dedicated domain (e.g. yourname.minenager.net), just like joining any standard public server.",
    },
    {
      q: "How does zero-port forwarding work?",
      a: "Minenager establishes an encrypted, high-speed reverse tunnel directly from your local engine to our global network edge. Inbound Minecraft traffic routes seamlessly without touching your home router or exposing port 25565.",
    },
    {
      q: "Does this protect my home IP address?",
      a: "Yes. Your personal residential IP address is hidden behind our cloud proxy. Players only see your custom subdomain, protecting your home network from scans and DDoS attempts.",
    },
    {
      q: "Can I cancel or pause my subscription anytime?",
      a: "Yes, you have full control with 1-click cancellation at any time directly in your Minenager account portal. There are zero contracts or cancellation fees.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#060913] text-slate-100 flex flex-col relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Full-Page Dynamic Animated Squares Grid */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <Squares
          direction="diagonal"
          speed={0.15}
          squareSize={48}
          borderColor="rgba(255, 255, 255, 0.045)"
          hoverFillColor="rgba(6, 182, 212, 0.12)"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10 flex flex-col flex-1">
        <Navbar />

        <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pt-24 pb-16 lg:pt-28 space-y-12">
          {/* Header Title */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-mono uppercase">
              MINENAGER CONNECT
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Host multiplayer Minecraft servers directly from your PC with{" "}
              <strong className="text-white">zero router configuration</strong>,{" "}
              <strong className="text-white">instant cloud tunnels</strong>, and{" "}
              <strong className="text-white">custom domain names</strong>.
            </p>
          </div>

          {/* Error Alert */}
          {checkoutError && (
            <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-xs sm:text-sm text-red-300 font-mono">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Pricing Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto items-stretch">
            {/* Tier 1: Community Core (Free) */}
            <div className="p-7 sm:p-8 rounded-3xl bg-[#0B1120] border border-white/15 flex flex-col justify-between shadow-xl">
              <div className="space-y-6">
                <div>
                  <div className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Community Edition
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1">
                    Community Core
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1.5 font-mono">
                    <span className="text-4xl sm:text-5xl font-extrabold text-white">$0</span>
                    <span className="text-xs text-slate-400">/ forever</span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
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
                    <span>Automated World &amp; Player Backups</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>Requires Manual Router Port Forwarding</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10">
                <a
                  href="/#download"
                  className="w-full py-3.5 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs sm:text-sm transition border border-white/15 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Free Engine</span>
                </a>
              </div>
            </div>

            {/* Tier 2: Minenager Connect (Pro $2.50/mo) */}
            <div className="relative p-7 sm:p-8 rounded-3xl bg-[#0B1120] border border-cyan-500/40 flex flex-col justify-between shadow-xl">
              {/* Active Cyan Left Marker Line */}
              <span className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r bg-cyan-400" />

              {/* Recommended Badge */}
              <div className="absolute -top-3.5 right-6 px-3 py-0.5 rounded-full bg-cyan-400 text-black font-mono font-extrabold text-[11px] uppercase tracking-wider">
                Recommended
              </div>

              <div className="space-y-6 pl-1">
                <div>
                  <div className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-wider">
                    Full Cloud Power
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white font-mono mt-1">
                    Minenager Connect
                  </h3>
                  <div className="mt-3 flex items-baseline gap-1.5 font-mono">
                    <span className="text-4xl sm:text-5xl font-extrabold text-cyan-300">$2.50</span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <p className="mt-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Zero router hassle. Instant encrypted public tunnels, custom domain names, and remote Discord bot controls.
                  </p>
                </div>

                <div className="h-px bg-white/10" />

                <ul className="space-y-3.5 text-xs sm:text-sm font-mono text-white">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-cyan-300">Zero Port-Forwarding Tunnel</strong> (1-Click Play)
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
                    <span>
                      <strong className="text-white">Home IP &amp; DDoS Shield</strong> (Full Privacy)
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>Remote Web Cockpit (Manage Anywhere)</span>
                  </li>
                </ul>
              </div>

              {/* Checkout / User Status CTA */}
              <div className="mt-8 pt-6 border-t border-white/10 pl-1">
                {isLoading ? (
                  <div className="py-3 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Checking account status...</span>
                  </div>
                ) : user?.tier === "pro" ? (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center">
                    <div className="text-emerald-400 font-mono font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Minenager Connect is Active!</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 font-mono">
                      Logged in as <strong>{user.username}</strong> ({user.email}). Tunnels unlocked.
                    </p>
                    <Link
                      href="/portal"
                      className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-xs font-bold transition border border-white/15"
                    >
                      <span>Go to Account Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>
                        Account: <strong className="text-white">{user.username}</strong>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                        Current: Free
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartCheckout}
                      disabled={isCheckingOut}
                      className="w-full py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 text-black font-extrabold font-mono text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      {isCheckingOut ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Opening Secure Checkout...</span>
                        </>
                      ) : (
                        <>
                          <span>Activate Minenager Connect ($2.50)</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-[11px] text-slate-400 text-center font-mono">
                      Sign in or create an account to link your tunnel domain.
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Link
                        href="/login?redirect=/upgrade"
                        className="flex-1 py-3 text-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono font-bold text-xs sm:text-sm transition border border-white/15 cursor-pointer"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/login?mode=register&redirect=/upgrade"
                        className="flex-1 py-3 text-center rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs sm:text-sm transition cursor-pointer"
                      >
                        Create Account &rarr;
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3 Core Superpowers Highlight Grid */}
          <div className="pt-8">
            <div className="text-center max-w-xl mx-auto mb-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                WHY PLAYERS LOVE CONNECT
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Engineered for maximum simplicity and zero network headaches.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-6 rounded-2xl bg-[#0B1120] border border-white/15 space-y-2">
                <h3 className="font-mono font-bold text-base text-white">
                  Zero Router Hassle
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  No port forwarding, NAT issues, or CGNAT blocks. Click "Start Tunnel" and share your domain instantly.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0B1120] border border-white/15 space-y-2">
                <h3 className="font-mono font-bold text-base text-white">
                  Clean Custom Domain
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  Get a dedicated <code>yourname.minenager.net</code> domain. No weird port numbers like <code>:25565</code> or dynamic IP changes.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0B1120] border border-white/15 space-y-2">
                <h3 className="font-mono font-bold text-base text-white">
                  Discord Bot Controls
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  Let your friends wake up or shut down the server with <code>!turnon</code> directly from your private Discord channel.
                </p>
              </div>
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="pt-6 max-w-3xl mx-auto w-full space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                FREQUENTLY ASKED QUESTIONS
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Everything you need to know about Minenager Connect.
              </p>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl bg-[#0B1120] border border-white/15 overflow-hidden transition"
                  >
                    <button
                      onClick={() => toggleFaq(index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-mono font-bold text-xs sm:text-sm text-white hover:text-cyan-300 transition cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-cyan-400 shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 text-xs sm:text-sm text-slate-300 leading-relaxed font-mono border-t border-white/5 pt-3">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
