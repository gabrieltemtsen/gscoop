'use client';

import { ReactNode, useState } from 'react';
import { Navbar } from './Navbar';
import { AIAssistantModal } from './AIAssistantModal';
import { Bot, Sparkles, ExternalLink, ShieldCheck, Heart } from 'lucide-react';
import Link from 'next/link';

export function AppShell({ children }: { children: ReactNode }) {
  const [aiModalOpen, setAiModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* Top Navbar */}
      <Navbar onOpenAiAssistant={() => setAiModalOpen(true)} />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Floating AI Coop Assistant Trigger */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setAiModalOpen(true)}
          className="group flex items-center gap-2.5 rounded-full border border-cyan-500/30 bg-[#121216]/90 px-4 py-2.5 text-xs font-semibold text-cyan-300 shadow-2xl backdrop-blur-xl hover:border-cyan-400 hover:bg-cyan-500/10 hover:text-white hover:scale-105 transition-all duration-200"
        >
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-300 group-hover:bg-cyan-500 group-hover:text-black transition-colors">
            <Bot className="h-3.5 w-3.5" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <span>Ask Coop AI</span>
        </button>
      </div>

      {/* AI Assistant Modal */}
      <AIAssistantModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />

      {/* Fintech Dark Footer */}
      <footer className="border-t border-white/[0.08] bg-[#0c0c0f] py-10 text-xs text-zinc-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
                <span className="font-bold text-sm text-white tracking-tight">GScoop</span>
              </div>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Trust-minimized cooperative rotating savings built natively on Arc Mainnet. No gas volatility, pure dollar saving.
              </p>
            </div>

            <div>
              <p className="font-semibold text-zinc-200 mb-2.5">Platform</p>
              <ul className="space-y-2">
                <li>
                  <Link href="/explore" className="hover:text-emerald-400 transition-colors">
                    Explore Pools
                  </Link>
                </li>
                <li>
                  <Link href="/create" className="hover:text-emerald-400 transition-colors">
                    Deploy Vault
                  </Link>
                </li>
                <li>
                  <button onClick={() => setAiModalOpen(true)} className="hover:text-cyan-400 transition-colors">
                    AI Coop Guide
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-zinc-200 mb-2.5">Arc Network</p>
              <ul className="space-y-2">
                <li>
                  <span className="text-zinc-300">Chain ID:</span> <span className="font-mono text-emerald-400">5042 (0x13b2)</span>
                </li>
                <li>
                  <span className="text-zinc-300">Gas Token:</span> <span className="font-semibold text-white">Native USDC</span>
                </li>
                <li>
                  <a
                    href="https://explorer.arc.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:text-emerald-400 transition-colors"
                  >
                    <span>Arc Explorer</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p className="font-semibold text-zinc-200 mb-2.5">Security & Guarantees</p>
              <div className="space-y-2 text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  <span>Immutable State Machine</span>
                </div>
                <p className="text-[11px]">
                  Protected with OpenZeppelin ReentrancyGuard and Pausable. Eliminates human treasurer risk.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400 text-[11px]">
            <p>© {new Date().getFullYear()} GScoop (Global Synergy Cooperative). Deployed natively on Arc Mainnet.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Sub-Second Finality Active
              </span>
              <a href="https://rpc.mainnet.arc.io" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300">
                RPC Status
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
