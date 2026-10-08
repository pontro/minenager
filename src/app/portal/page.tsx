"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { fetchTunnelConfig, TunnelConfig } from "@/lib/api";
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
  Copy,
  Check,
  Key,
  Settings,
  Server,
  Terminal,
  Loader2,
  Lock,
  Sparkles
} from "lucide-react";

export default function PortalPage() {
  const router = useRouter();
  const { user, token, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "tunnel" | "engine" | "account">("overview");
  const [tunnel, setTunnel] = useState<TunnelConfig | null>(null);
  const [loadingTunnel, setLoadingTunnel] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login?redirect=/portal");
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (token && user?.tier === "pro") {
      setLoadingTunnel(true);
      fetchTunnelConfig(token)
        .then((res) => setTunnel(res))
        .finally(() => setLoadingTunnel(false));
    }
  }, [token, user]);

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
  const domainName = `${user.username}.minenager.net`;
  const remoteCockpitUrl = `https://${domainName}`;

  const copyToClipboard = (text: string, keyName: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(keyName);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-[#060913] relative overflow-hidden">
      <Navbar />

      <div className="flex-1 max-w-6xl mx-auto px-6 py-10 w-full">
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

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-8 overflow-x-auto font-mono text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "overview"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Overview &amp; Cockpit</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tunnel")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "tunnel"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Connect Domain &amp; Ports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("engine")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "engine"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Server Engine Pairing</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("account")}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === "account"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Account Settings</span>
          </button>
        </div>

        {/* Tab 1: Overview & Cockpit */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Pro Remote Cockpit Hero Card */}
            {isPro ? (
              <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border-2 border-cyan-400/40 glow-primary relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Minenager Connect Pro Active</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white font-mono">
                      Remote Web Cockpit
                    </h2>
                    <p className="text-slate-300 text-sm max-w-xl">
                      Access and manage your home Minecraft server from your phone, laptop, or work without opening ports on your router.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <a
                      href={remoteCockpitUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center justify-center gap-2 glow-primary transition"
                    >
                      <span>Open Remote Cockpit</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs">
                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 block mb-1">Your Remote Web URL:</span>
                    <div className="flex items-center justify-between gap-2 text-cyan-300 font-bold">
                      <span className="break-all">{remoteCockpitUrl}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(remoteCockpitUrl, "cockpit_url")}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy URL"
                      >
                        {copiedKey === "cockpit_url" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-black/40 border border-white/5">
                    <span className="text-slate-400 block mb-1">Friends Join Address (Minecraft):</span>
                    <div className="flex items-center justify-between gap-2 text-white font-bold">
                      <span className="break-all">{domainName}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(domainName, "mc_domain")}
                        className="p-1 text-slate-400 hover:text-white"
                        title="Copy Domain"
                      >
                        {copiedKey === "mc_domain" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Free Plan Upgrade Banner */
              <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-cyan-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Free Community Engine</span>
                  </div>
                  <h2 className="text-xl font-bold text-white font-mono">
                    Unlock Remote Phone Cockpit &amp; Zero Portforwarding
                  </h2>
                  <p className="text-slate-300 text-sm max-w-xl">
                    You are currently using the free local engine at <code className="text-cyan-300 font-mono">localhost:8000</code>. Upgrade to Minenager Connect ($2.50/mo) to manage your server from anywhere and give your friends a dedicated domain.
                  </p>
                </div>
                <Link
                  href="/upgrade"
                  className="px-6 py-3.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold font-mono text-sm flex items-center justify-center gap-2 glow-primary transition shrink-0"
                >
                  <Zap className="w-4 h-4" />
                  <span>Get Minenager Connect ($2.50)</span>
                </Link>
              </div>
            )}

            {/* Quick Two Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local Engine Instructions Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Local Host Engine
                    </span>
                    <Terminal className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono mb-2">Host Engine on Your PC</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    Download and run the Minenager server engine on your computer. It uses all your PC&apos;s CPU &amp; RAM with zero hosting limitations.
                  </p>
                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-300 space-y-1.5">
                    <div>Local URL: <span className="text-cyan-300">http://localhost:8000</span></div>
                    <div>Default Game Port: <span className="text-white">25565</span></div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <a
                    href="/#download"
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs flex items-center justify-center gap-2 border border-white/10 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Server Engine</span>
                  </a>
                </div>
              </div>

              {/* Plan Details Card */}
              <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                      Subscription Summary
                    </span>
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-white font-mono mb-2">
                    {isPro ? "Minenager Connect Pro ($2.50/mo)" : "Free Community Tier ($0)"}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">
                    {isPro
                      ? "Your account is verified with high-speed tunnel relay and remote cockpit enabled."
                      : "Upgrade anytime to enable cloud tunnels, remote controls, and custom subdomain allocation."}
                  </p>
                  <div className="space-y-2 font-mono text-xs text-slate-300 border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Status:</span>
                      <span className={isPro ? "text-emerald-400 font-bold" : "text-slate-400"}>
                        {isPro ? "Active & Verified" : "Free Plan"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Remote Cockpit:</span>
                      <span className={isPro ? "text-cyan-400 font-bold" : "text-slate-500"}>
                        {isPro ? "Enabled (HTTPS)" : "Disabled (Local only)"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-white/10">
                  <Link
                    href={isPro ? "/portal" : "/upgrade"}
                    className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-xs flex items-center justify-center gap-2 border border-white/10 transition"
                  >
                    <span>{isPro ? "Manage Billing & Invoices" : "View Upgrade Benefits"}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Connect Domain & Ports */}
        {activeTab === "tunnel" && (
          <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white font-mono">Minenager Connect Domain</h2>
              </div>
              <p className="text-sm text-slate-300 max-w-2xl">
                Your server&apos;s allocated cloud relay subdomain. When your server engine is running with Minenager Pro, players can join through this address with zero router port forwarding.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/10">
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-xs font-mono text-slate-400">Assigned Domain:</span>
                  <div className="flex items-center justify-between gap-2 font-mono text-sm font-bold text-cyan-300">
                    <span>{domainName}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(domainName, "domain_tab")}
                      className="p-1 text-slate-400 hover:text-white"
                    >
                      {copiedKey === "domain_tab" ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/10 space-y-2">
                  <span className="text-xs font-mono text-slate-400">Direct TCP Port (Raw):</span>
                  <div className="font-mono text-sm text-white font-bold">
                    {tunnel?.public_port ? `relay.minenager.net:${tunnel.public_port}` : "25565 (Default)"}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20 space-y-3 font-mono text-xs text-slate-300">
                <div className="font-bold text-cyan-300 uppercase tracking-wider">How zero-portforwarding works:</div>
                <p>1. Open your <strong>Minenager Server Engine</strong> locally.</p>
                <p>2. Log into your account under the <strong>Account</strong> menu.</p>
                <p>3. Your local server engine establishes an outbound secure tunnel to the cloud relay. Friends type <strong className="text-white">{domainName}</strong> in Minecraft to join!</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Server Engine Pairing */}
        {activeTab === "engine" && (
          <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Key className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white font-mono">Server Engine Pairing Token</h2>
              </div>
              <p className="text-sm text-slate-300 max-w-2xl">
                Link your local server engine to this cloud account automatically without entering your password every time.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-black/40 border border-white/10 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
                    Your Auth Token
                  </span>
                  <div className="font-mono text-xs text-slate-300 break-all max-w-xl">
                    {token ? `${token.slice(0, 32)}••••••••••••••••••••••••••••••••` : "No active session"}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => token && copyToClipboard(token, "auth_token")}
                  className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-mono font-bold text-xs flex items-center gap-2 shrink-0 transition glow-primary"
                >
                  {copiedKey === "auth_token" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === "auth_token" ? "Copied!" : "Copy Token"}</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-400">
              <p>💡 <strong>Pro Tip</strong>: You can also simply log into the local server engine using your username and password.</p>
            </div>
          </div>
        )}

        {/* Tab 4: Account Settings */}
        {activeTab === "account" && (
          <div className="p-6 sm:p-8 rounded-2xl bg-card-glass border border-white/10 space-y-6">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <Settings className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold text-white font-mono">Account &amp; Security Settings</h2>
              </div>
              <p className="text-sm text-slate-300">
                Manage your credentials and preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-mono text-xs pt-4 border-t border-white/10">
              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400">Username:</span>
                <div className="text-white font-bold text-sm">{user.username}</div>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-1">
                <span className="text-slate-400">Email Address:</span>
                <div className="text-white font-bold text-sm">{user.email}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-between items-center">
              <div className="text-xs text-slate-400 font-mono">
                Need to change your password or delete your account? Contact support or use the reset flow.
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-mono text-xs border border-red-500/30 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}

