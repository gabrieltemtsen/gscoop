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
import { fetchAllOnChainVaults, SHOWCASE_VAULT_ADDRESS } from '@/lib/onChainVaults';
import { VaultCard } from '@/components/VaultCard';
import { useEffect, useState } from 'react';

export default function Home() {
  const [featuredVaults, setFeaturedVaults] = useState<any[]>([]);

  useEffect(() => {
    let isMounted = true;
    async function loadVaults() {
      try {
        const liveVaults = await fetchAllOnChainVaults();
        if (isMounted) {
          if (liveVaults.length > 0) {
            setFeaturedVaults(liveVaults.slice(0, 3));
          } else {
            setFeaturedVaults(getStoredVaults().slice(0, 3));
          }
        }
      } catch (err) {
        console.error('Failed to load on-chain vaults for home page:', err);
        if (isMounted) {
          setFeaturedVaults(getStoredVaults().slice(0, 3));
        }
      }
    }
    loadVaults();
    return () => {
      isMounted = false;
    };
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
              Save in pure dollar amounts with your trusted circle on Arc Mainnet. Automated smart contract payouts with native USDC gas, float yield, and zero friction.
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
                <p className="text-xs text-zinc-400">Settlement</p>
                <p className="text-sm font-bold text-white mt-0.5 flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  &lt;1 Second
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Security</p>
                <p className="text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  100% On-Chain
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
                    <span className="text-xs text-zinc-400">Deployed Vault</span>
                    <span className="text-xs text-emerald-400 font-mono">Chain ID: 5042</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-0.5">Arc Global Synergy Alpha</h3>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-black/50 p-4 border border-white/[0.06]">
                  <div>
                    <span className="text-[11px] text-zinc-400">Cycle Payout Pot</span>
                    <p className="text-xl font-extrabold text-emerald-400 font-mono mt-0.5">$250.00</p>
                    <span className="text-[10px] text-zinc-400">5 spots × $50 USDC</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400">Estimated Gas Fee</span>
                    <p className="text-xl font-extrabold text-cyan-400 font-mono mt-0.5">~$0.005</p>
                    <span className="text-[10px] text-zinc-400">Native USDC Gas</span>
                  </div>
                </div>

                {/* Turn Timeline Preview */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-zinc-400">
                    <span>Queue Rotation</span>
                    <span className="text-emerald-400 font-medium">Verified On-Chain</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-emerald-400/50 p-2.5 text-center shadow-lg shadow-emerald-500/10">
                      <span className="block text-[10px] text-emerald-300 font-semibold">Beneficiary #1</span>
                      <span className="font-mono text-xs text-emerald-300 font-bold">0x6268...</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                    <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                      <span className="block text-[10px] text-zinc-400">Spot #2</span>
                      <span className="font-mono text-xs text-zinc-400">Open Queue</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                    <div className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-center">
                      <span className="block text-[10px] text-zinc-400">Spot #3</span>
                      <span className="font-mono text-xs text-zinc-400">Open Queue</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <Link
                    href={`/vault/${SHOWCASE_VAULT_ADDRESS}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-2.5 text-xs font-semibold text-black hover:opacity-95 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <span>Enter Live Showcase Vault</span>
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
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Architectural Advantage</span>
          <h2 className="mt-2 text-3xl font-extrabold text-white">
            Built Specifically for Arc Mainnet
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Frictionless collaborative finance with sub-cent gas fees and instant settlement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Edge 1 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 space-y-3 hover:border-emerald-500/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Coins className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Native USDC Gas Token</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              USDC is the protocol-level gas token on Arc. Deposits and ~$0.005 network fees are 100% dollar-denominated with zero token bridging.
            </p>
          </div>

          {/* Edge 2 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 space-y-3 hover:border-cyan-500/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Automated State Machine</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Eliminates treasurer fraud. Member queues are immutable FIFO state machines with deterministic, instant payouts every cycle.
            </p>
          </div>

          {/* Edge 3 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#121215] p-6 space-y-3 hover:border-amber-500/30 transition-all">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-white">Sub-Second Finality</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Transactions settle in fractions of a second with deterministic finality on Arc Mainnet, eliminating confirmation lag.
            </p>
          </div>

        </div>
      </section>

      {/* Modern 3-Column Comparative Feature Breakdown */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-white/[0.08]">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">Comparison</span>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
            The Savings Paradigm Evolution
          </h2>
          <p className="mt-2 text-xs text-zinc-400">
            Why smart contract cooperatives on Arc outperform offline groups and legacy dApps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Traditional */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#101014] p-6 space-y-4">
            <div className="inline-flex rounded-full bg-rose-500/10 border border-rose-500/20 px-3 py-1 text-xs font-bold text-rose-400">
              Traditional Savings Groups
            </div>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Human organizer theft and default risks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Manual cash handling or high bank transfer fees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Idle funds earn zero interest</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Hard capped at 5-10 members due to bookkeeping</span>
              </li>
            </ul>
          </div>

          {/* Standard Web3 */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#101014] p-6 space-y-4">
            <div className="inline-flex rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 text-xs font-bold text-amber-400">
              Standard Web3 dApps
            </div>
            <ul className="space-y-3 text-xs text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✕</span>
                <span>Must acquire ETH, bridge tokens, and calculate gwei</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✕</span>
                <span>Volatile gas spikes make small deposits uneconomical</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✕</span>
                <span>15-60 second block wait times</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">✕</span>
                <span>Complex UX alienates non-crypto users</span>
              </li>
            </ul>
          </div>

          {/* GScoop on Arc */}
          <div className="relative rounded-2xl border border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 to-[#121216] p-6 space-y-4 shadow-xl shadow-emerald-500/5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-3 py-1 text-xs font-bold text-emerald-300">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>GScoop on Arc Mainnet</span>
            </div>
            <ul className="space-y-3 text-xs text-zinc-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Native USDC Gas</strong> — Deposit & pay fees in pure USDC</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Sub-Second Finality</strong> — Immediate pot settlements</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>5.2% Float Yield</strong> — Idle funds earn interest</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Turn Borrowing</strong> — Borrow up to 75% before your turn</span>
              </li>
            </ul>
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
