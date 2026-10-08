"use client";

import Link from "next/link";
import { Box, ArrowRight, User as UserIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const { user, isLoading } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full py-4 px-4 sm:px-6 pointer-events-none">
      <nav className="max-w-6xl mx-auto h-14 px-4 sm:px-6 rounded-full border border-white/15 bg-[#0B1120]/80 shadow-2xl backdrop-blur-2xl flex items-center justify-between pointer-events-auto transition-all duration-300 hover:border-white/25">
        <div className="flex items-center gap-6 sm:gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 transition-transform group-hover:scale-105">
              <Box className="w-4 h-4" />
            </div>
            <span className="font-bold text-base tracking-tight font-mono text-white">MINENAGER</span>
          </Link>
          <div className="hidden md:flex items-center gap-5 text-xs sm:text-sm font-medium text-slate-300">
            <Link href="/build" className="hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-lg transition">
              Web Builder
            </Link>
            <Link href="/mods" className="hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-lg transition">
              Mod Catalog
            </Link>
            <Link href="/upgrade" className="hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-lg transition">
              Upgrade Pro
            </Link>
            <a
              href="https://github.com/pontro/minenager"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white hover:bg-white/5 px-2.5 py-1 rounded-lg transition"
            >
              Docs
            </a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && user ? (
            <Link
              href="/portal"
              className="flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-white/15 bg-white/5 transition"
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
            <Link href="/login" className="text-xs font-medium text-white/80 hover:text-white px-3 py-1.5 transition">
              Sign In
            </Link>
          )}

          <Link
            href="/upgrade"
            className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-cyan-500/10"
          >
            <span>Get Pro</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
