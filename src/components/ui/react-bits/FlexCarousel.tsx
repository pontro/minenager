"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Terminal, Layers, Activity, Sparkles } from "lucide-react";

export interface FlexItem {
  id: string;
  title: string;
  category: string;
  badge?: string;
  imageSrc: string;
  icon: React.ElementType;
  tagColor: string;
}

interface FlexCarouselProps {
  items: FlexItem[];
  defaultActiveId?: string;
  className?: string;
}

export default function FlexCarousel({
  items,
  defaultActiveId,
  className = "",
}: FlexCarouselProps) {
  const [activeId, setActiveId] = useState<string>(
    defaultActiveId || items[0]?.id || ""
  );

  return (
    <div className={`w-full flex flex-col md:flex-row gap-3 h-[420px] sm:h-[480px] lg:h-[500px] ${className}`}>
      {items.map((item) => {
        const isActive = activeId === item.id;
        const Icon = item.icon;

        return (
          <div
            key={item.id}
            onClick={() => setActiveId(item.id)}
            onMouseEnter={() => setActiveId(item.id)}
            className={`relative rounded-2xl border transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden cursor-pointer ${
              isActive
                ? "flex-[4] sm:flex-[3.5] bg-[#0B1120] border-cyan-500/40 shadow-2xl ring-1 ring-cyan-400/20"
                : "flex-1 bg-[#0B1120] border-white/15 hover:border-white/25 hover:bg-[#0e1628]"
            }`}
          >
            {/* Background Screenshot */}
            <div className="absolute inset-0 w-full h-full transform-gpu bg-[#0B1120]">
              <Image
                src={item.imageSrc}
                alt={item.title}
                fill
                priority={isActive}
                unoptimized
                className={`object-cover object-top transition-opacity duration-300 ${
                  isActive ? "opacity-100" : "opacity-25"
                }`}
              />
              {/* Darkening gradient overlay */}
              <div
                className={`absolute inset-0 transition-opacity duration-300 ${
                  isActive
                    ? "bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"
                    : "bg-black/60 hover:bg-black/40"
                }`}
              />
            </div>

            {/* Inactive Vertical Teaser Strip Header (When collapsed on Desktop) */}
            {!isActive && (
              <div className="hidden md:flex absolute inset-0 p-4 flex-col items-center justify-between z-10 select-none">
                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                  <Icon className="w-4 h-4" />
                </div>

                {/* Rotated Vertical Category Label */}
                <div className="[writing-mode:vertical-rl] rotate-180 font-mono text-xs font-bold text-slate-300 tracking-wider uppercase">
                  {item.category}
                </div>

                <div className="w-2 h-2 rounded-full bg-white/10" />
              </div>
            )}

            {/* Inactive Horizontal Header (When collapsed on Mobile) */}
            {!isActive && (
              <div className="flex md:hidden absolute inset-0 p-3 items-center justify-between z-10 select-none">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-slate-400" />
                  <span className="font-mono text-xs font-bold text-slate-300">
                    {item.category}
                  </span>
                </div>
              </div>
            )}

            {/* Active Expanded Card Footer Bar */}
            {isActive && (
              <div className="absolute bottom-0 inset-x-0 p-4 sm:p-5 z-20 flex items-center justify-between bg-[#060913] border-t border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-wider">
                      {item.category}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-white tracking-tight">
                      {item.title}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
