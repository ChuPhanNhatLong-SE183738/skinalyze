"use client";

import { Activity } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative z-10 py-12 md:py-16 bg-black/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <div className="font-black text-3xl md:text-4xl tracking-tighter mb-4 text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-emerald-400" />
            SKINALYZE
          </div>
          <div className="flex gap-2 text-xs font-mono text-gray-400">
            <span>Future of Dermatology © 2025</span>
          </div>
        </div>

        <div className="flex gap-6 md:gap-8 flex-wrap">
          <a
            href="#"
            className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer"
            data-hover="true"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-gray-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors cursor-pointer"
            data-hover="true"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
