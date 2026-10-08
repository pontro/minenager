"use client";

import Link from "next/link";
import { Box, ArrowRight, User as UserIcon, Zap } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

export default function Navbar() {
  const { user, isLoading } = useAuth();

  return (
    <nav className="w-full border-b border-white/10 bg-[#060913] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 transition-transform group-hover:scale-105">
              <Box className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg tracking-tight font-mono text-white">MINENAGER</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <Link href="/#features" className="hover:text-white transition">
              Features
            </Link>
            <Link href="/build" className="hover:text-white transition flex items-center gap-1.5">
              Web Builder
              <span className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                FREE
              </span>
            </Link>
            <Link href="/mods" className="hover:text-white transition flex items-center gap-1.5">
              Mod Catalog
            </Link>
            <Link href="/upgrade" className="hover:text-white transition flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upgrade Pro</span>
            </Link>
            <a
              href="https://github.com/pontro/minenager"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white transition"
            >
              Docs
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3.5">
          <a
            href="https://github.com/pontro/minenager"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white px-3 py-1.5 rounded-md border border-white/10 bg-white/5 transition"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
          </a>

          {!isLoading && user ? (
            <Link
              href="/portal"
              className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 transition"
            >
              <UserIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>{user.username}</span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  user.tier === "pro"
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : "bg-zinc-800 text-zinc-400"
                }`}
              >
                {user.tier.toUpperCase()}
              </span>
            </Link>
          ) : (
            <Link href="/login" className="text-xs font-medium text-white/80 hover:text-white px-3 py-1.5">
              Sign In
            </Link>
          )}

          <Link
            href="/upgrade"
            className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black font-semibold text-xs transition-all flex items-center gap-2"
          >
            <span>Get Minenager Pro</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
