'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  Coins, 
  ShieldCheck, 
  Zap, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  TrendingUp, 
  Clock, 
  Lock, 
  RefreshCw,
  Layers,
  ChevronRight
} from 'lucide-react';
import { getStoredVaults } from '@/lib/vaultStore';
import { VaultCard } from '@/components/VaultCard';
import { useEffect, useState } from 'react';

export default function Home() {
  const [featuredVaults, setFeaturedVaults] = useState<any[]>([]);

  useEffect(() => {
    const vaults = getStoredVaults();
    setFeaturedVaults(vaults.slice(0, 3));
  }, []);

  return (
    <div className="relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-gradient-to-b from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl" />
      <div className="pointer-events-none absolute top-[450px] right-[-100px] -z-10 h-[400px] w-[500px] rounded-full bg-cyan-500/5 blur-3xl" />

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-16 sm:px-6 lg:px-8 text-center sm:text-left">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            
            {/* Tag Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400 backdrop-blur-md">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Deployed Natively on Arc Mainnet (Chain ID: 5042)</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Decentralized <br className="hidden sm:inline" />
              Cooperative Savings.{' '}
              <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Zero Gas Friction.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
              GScoop transforms the time-tested <strong className="text-zinc-200">Rotating Savings Circle</strong> model into an immutable, trust-minimized state machine on Arc. Save together with your circle in pure <strong className="text-white">native USDC</strong>—without bridging ETH, calculating gwei, or risking human treasurer fraud.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3.5 text-sm font-semibold text-black shadow-lg shadow-emerald-500/25 hover:opacity-95 hover:scale-[1.01] active:scale-[0.99] transition-all"
              >
                <span>Explore Live Pools</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/create"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-[#141418] px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/[0.08] hover:border-white/25 transition-all"
              >
                <Layers className="h-4 w-4 text-zinc-400" />
                <span>Deploy a Cooperative</span>
              </Link>
            </div>

            {/* Zero Friction Highlights */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/[0.08] text-left">
              <div>
                <p className="text-xs text-zinc-400">Gas Asset</p>
                <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <Coins className="h-3.5 w-3.5 text-emerald-400" />
                  Native USDC
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Avg Settlement</p>
                <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  &lt;1 Second
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Treasurer Risk</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  0% (Immutable)
                </p>
              </div>
            </div>
          </div>

          {/* Hero Live Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative rounded-3xl border border-white/[0.12] bg-[#121216]/90 p-6 shadow-2xl backdrop-blur-xl">
              
              {/* Card Badge */}
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Live Arc State Machine
                  </span>
                </div>
                <span className="font-mono text-xs text-zinc-400">Block Finality: Instant</span>
              </div>

              {/* Pool Simulation View */}
              <div className="mt-5 space-y-4">
                <div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Cooperative Name</span>
                    <span className="text-xs text-emerald-400 font-mono">Chain ID: 5042</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">Synergy Alpha Circle</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-black/50 p-4 border border-white/[0.06]">
                  <div>
                    <span className="text-[11px] text-zinc-400">Cycle Payout Pot</span>
                    <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">$250.00</p>
                    <span className="text-[10px] text-zinc-400">5 members × $50</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400">Estimated Gas Fee</span>
                    <p className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">~$0.005</p>
                    <span className="text-[10px] text-zinc-400">Deducted in USDC</span>
                  </div>
                </div>

                {/* Turn Timeline Preview */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Queue Rotation</span>
                    <span className="text-emerald-400 font-medium">Turn #2 Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl bg-emerald-500/20 border border-emerald-500/30 p-2.5 text-center">
                      <span className="block text-[10px] text-zinc-400">Paid Cycle 1</span>
                      <span className="font-mono text-xs text-white font-semibold">0xA11C...</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                    <div className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-emerald-400/50 p-2.5 text-center shadow-lg shadow-emerald-500/10">
                      <span className="block text-[10px] text-emerald-300 font-semibold">Beneficiary Now</span>
                      <span className="font-mono text-xs text-emerald-300 font-bold">0xB0B2...</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                    <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                      <span className="block text-[10px] text-zinc-400">Next Turn</span>
                      <span className="font-mono text-xs text-zinc-400">0xCAFE...</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    href="/explore"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/[0.08] py-2.5 text-xs font-semibold text-white hover:bg-white/[0.15] transition-all"
                  >
                    <span>View All Active Cooperatives</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3 Core Technical Edges Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/[0.08]">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Architectural Advantage</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
            Built Specifically for Arc Mainnet
          </h2>
          <p className="mt-3 text-sm sm:text-base text-zinc-400">
            Traditional Web3 dApps force users through friction-filled bridging loops. GScoop leverages Arc's protocol innovations to provide a seamless fintech experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Edge 1 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 space-y-4 hover:border-emerald-500/30 transition-all group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Coins className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Native USDC Gas Token</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              USDC is the native gas asset on Arc Mainnet (18 decimals). Users never hear the word "gas token" or have to bridge ETH. Savings deposits and network fees are 100% dollar-denominated.
            </p>
            <div className="pt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Zero-token-bridging onboarding</span>
            </div>
          </div>

          {/* Edge 2 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 space-y-4 hover:border-cyan-500/30 transition-all group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Trust-Minimized State Machine</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Replaces the traditional human treasurer with <code className="text-zinc-200">GScoopVault.sol</code>. Payout queues are immutable, mathematically rotated (<code className="text-zinc-200">cycle % queue.length</code>), and instant.
            </p>
            <div className="pt-2 text-[11px] font-mono text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Guaranteed automated rotation</span>
            </div>
          </div>

          {/* Edge 3 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 space-y-4 hover:border-amber-500/30 transition-all group">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Sub-Second Deterministic Finality</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No more waiting 2-5 minutes for blocks to confirm or polling balances in a loop. Arc confirms transactions with deterministic finality in fractions of a second.
            </p>
            <div className="pt-2 text-[11px] font-mono text-amber-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Instant UI state updates</span>
            </div>
          </div>

        </div>
      </section>

      {/* Comparison Table: Traditional vs Standard Web3 vs GScoop */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/[0.1] bg-[#101014] p-8 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h3 className="text-2xl font-bold text-white">The Savings Paradigm Evolution</h3>
            <p className="text-xs text-zinc-400 mt-2">Why GScoop on Arc is the future of collaborative community finance.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-zinc-400 font-medium">
                  <th className="py-3 px-4">Feature</th>
                  <th className="py-3 px-4 text-rose-400">Traditional Savings Group</th>
                  <th className="py-3 px-4 text-amber-400">Standard Web3 dApp</th>
                  <th className="py-3 px-4 text-emerald-400 font-bold bg-emerald-500/5 rounded-t-xl">GScoop on Arc</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-zinc-300">
                <tr>
                  <td className="py-4 px-4 font-semibold text-white">Gas / Onboarding Friction</td>
                  <td className="py-4 px-4 text-zinc-400">Physical cash / Bank transfers</td>
                  <td className="py-4 px-4 text-amber-300/80">Must buy ETH, bridge tokens, calculate gwei</td>
                  <td className="py-4 px-4 font-semibold text-emerald-400 bg-emerald-500/5">
                    Native USDC only (No separate gas token)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-semibold text-white">Custody & Treasurer Risk</td>
                  <td className="py-4 px-4 text-rose-400">High (Human organizer can steal or flee)</td>
                  <td className="py-4 px-4 text-zinc-400">Contract-based, but complex approvals</td>
                  <td className="py-4 px-4 font-semibold text-emerald-400 bg-emerald-500/5">
                    Immutable Queue + Reentrancy Guard
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-semibold text-white">Settlement Speed</td>
                  <td className="py-4 px-4 text-zinc-400">Days / Manual collection</td>
                  <td className="py-4 px-4 text-zinc-400">12 - 60 seconds (Variable gas congestion)</td>
                  <td className="py-4 px-4 font-semibold text-emerald-400 bg-emerald-500/5">
                    Sub-second deterministic finality
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-semibold text-white">Fee Denomination</td>
                  <td className="py-4 px-4 text-zinc-400">High banking wire / ATM fees</td>
                  <td className="py-4 px-4 text-zinc-400">Fluctuating Gwei / Volatile crypto</td>
                  <td className="py-4 px-4 font-semibold text-emerald-400 bg-emerald-500/5 rounded-b-xl">
                    Exact cents ($0.005 in USDC)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Featured Pools Preview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/[0.08]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Live on Arc</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">Active Cooperative Vaults</h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            <span>View all pools</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredVaults.map((vault) => (
            <VaultCard key={vault.address} vault={vault} />
          ))}
        </div>
      </section>

      {/* Deploy CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-[#121216] to-cyan-950/30 p-8 sm:p-12 shadow-2xl overflow-hidden text-center sm:text-left">
          <div className="relative z-10 max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ready to launch your community savings circle?
            </h2>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Deploy a customizable GScoop vault on Arc Mainnet in less than 30 seconds. Choose contribution amounts, cycle durations, and invite your circle.
            </p>
            <div className="pt-2">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-400 px-6 py-3.5 text-sm font-semibold text-black shadow-lg shadow-emerald-400/20 hover:bg-emerald-300 transition-all"
              >
                <span>Deploy Vault on Arc</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
