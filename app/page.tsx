'use client';

import Link from 'next/link';
import { 
  ArrowRight, 
  Coins, 
  ShieldCheck, 
  Zap, 
  Users, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  Layers,
  ChevronRight,
  TrendingUp,
  ExternalLink,
  ArrowUpRight,
  Sliders,
  DollarSign,
  Lock
} from 'lucide-react';
import { getStoredVaults } from '@/lib/vaultStore';
import { fetchAllOnChainVaults, SHOWCASE_VAULT_ADDRESS } from '@/lib/onChainVaults';
import { FACTORY_ADDRESS } from '@/lib/contracts';
import { formatAddress, formatUSDC } from '@/lib/utils';
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

  const heroVault = featuredVaults[0];
  const heroName = heroVault?.name || 'Arc Global Synergy Alpha';
  const heroSpots = heroVault
    ? Number(heroVault.maxMembers) > 0
      ? Number(heroVault.maxMembers)
      : Math.max(Number(heroVault.memberCount), 5)
    : 5;
  const heroContribution = heroVault ? formatUSDC(heroVault.contributionAmount) : '10.00';
  const heroPot = heroVault
    ? formatUSDC(heroVault.contributionAmount * BigInt(heroSpots))
    : '50.00';
  const heroAddress = heroVault?.address || SHOWCASE_VAULT_ADDRESS;
  const heroSpot1 = heroVault?.members?.[0]
    ? formatAddress(heroVault.members[0])
    : '0x6268...A024';
  const heroSpot2 = heroVault?.members?.[1]
    ? formatAddress(heroVault.members[1])
    : 'Queue Spot #2';
  const heroSpot3 = heroVault?.members?.[2]
    ? formatAddress(heroVault.members[2])
    : 'Queue Spot #3';

  return (
    <div className="relative">
      
      {/* Top Protocol Status Ticker */}
      <div className="border-b border-white/[0.06] bg-[#0c0c0f]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-zinc-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Arc Mainnet (Chain 5042)
              </span>
              <span className="text-zinc-600 hidden sm:inline">•</span>
              <span className="hidden sm:inline font-mono">Gas Asset: Native USDC</span>
              <span className="text-zinc-600 hidden md:inline">•</span>
              <span className="hidden md:inline">Finality: Sub-Second (&lt;1s)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">Factory:</span>
              <a 
                href={`https://explorer.arc.io/address/${FACTORY_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-zinc-300 hover:text-emerald-400 transition-colors inline-flex items-center gap-1"
              >
                <span>{FACTORY_ADDRESS.slice(0, 6)}...{FACTORY_ADDRESS.slice(-4)}</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:pt-20 sm:pb-24 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/90 px-3.5 py-1 text-xs text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="font-medium text-zinc-200">Decentralized Capital Formation</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">Rotating Liquidity Pools</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white leading-[1.12]">
              Programmable Group Savings.{' '}
              <span className="text-zinc-400 font-medium">
                Deterministic Settlement on Arc.
              </span>
            </h1>

            {/* Sub-headline */}
            <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
              Eliminate treasurer default and manual spreadsheets. Pool recurring liquidity with trusted circles in native USDC with automated FIFO rotations, flexible liquidity advances, and sub-cent gas fees.
            </p>

            {/* CTA Group */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pt-2">
              <Link
                href="/explore"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-black hover:bg-zinc-200 transition-all shadow-sm"
              >
                <span>Explore Active Pools</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/create"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-[#121216] px-5 py-3 text-xs sm:text-sm font-semibold text-zinc-200 hover:bg-zinc-800/80 hover:text-white transition-all"
              >
                <Layers className="h-4 w-4 text-zinc-400" />
                <span>Deploy Circle Contract</span>
              </Link>
            </div>

            {/* Precision Metric Highlights */}
            <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-zinc-800/80">
              <div>
                <p className="text-[11px] text-zinc-400 font-medium">Protocol Gas</p>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5 flex items-center gap-1 font-mono">
                  <Coins className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>Native USDC</span>
                </p>
                <span className="text-[10px] text-zinc-400">Zero token bridging</span>
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 font-medium">Execution</p>
                <p className="text-xs sm:text-sm font-bold text-white mt-0.5 flex items-center gap-1 font-mono">
                  <Zap className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                  <span>&lt;1s Finality</span>
                </p>
                <span className="text-[10px] text-zinc-400">Deterministic speed</span>
              </div>
              <div>
                <p className="text-[11px] text-zinc-400 font-medium">Custody</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
                  <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  <span>100% On-Chain</span>
                </p>
                <span className="text-[10px] text-zinc-400">Non-custodial vaults</span>
              </div>
            </div>
          </div>

          {/* Hero Right: Live Protocol Execution Terminal */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl border border-zinc-800/90 bg-[#101014] p-5 sm:p-6 shadow-2xl backdrop-blur-xl">
              
              {/* Terminal Header */}
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold text-zinc-200 tracking-wide uppercase">
                    Live Protocol Terminal
                  </span>
                </div>
                <span className="font-mono text-[11px] text-zinc-400">Chain ID: 5042</span>
              </div>

              {/* Pool Details */}
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Active Showcase Circle</span>
                    <span className="text-emerald-400 font-mono text-[11px]">
                      {heroVault ? `Cycle #${heroVault.currentCycle.toString()}` : 'Cycle #1'}
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5 truncate">{heroName}</h3>
                  <p className="text-[11px] font-mono text-zinc-400 mt-0.5">{heroAddress}</p>
                </div>

                {/* Ledger Key Numbers */}
                <div className="grid grid-cols-2 gap-3 rounded-xl bg-black/40 p-3.5 border border-zinc-800/80">
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium">Target Cycle Pot</span>
                    <p className="text-lg font-bold text-white font-mono tabular-nums mt-0.5">
                      ${heroPot}{' '}
                      <span className="text-xs font-normal text-zinc-400">USDC</span>
                    </p>
                    <span className="text-[10px] text-zinc-400">
                      {heroSpots} members × ${heroContribution}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-400 font-medium">Network Gas Cost</span>
                    <p className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-0.5">~$0.005</p>
                    <span className="text-[10px] text-zinc-400">Paid directly in USDC</span>
                  </div>
                </div>

                {/* Queue Rotation Ledger */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400 font-medium">FIFO Queue Schedule</span>
                    <span className="text-zinc-400 font-mono text-[11px]">
                      {heroVault ? `${heroVault.memberCount.toString()} Enrolled` : '5 Enrolled'}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400 font-mono">
                          TURN 1
                        </span>
                        <span className="font-mono text-emerald-300 text-xs">{heroSpot1}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-400">Current Payout</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 border border-zinc-800/60 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 font-mono">
                          TURN 2
                        </span>
                        <span className="font-mono text-zinc-300 text-xs">{heroSpot2}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Next in Rotation</span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-zinc-900/60 border border-zinc-800/60 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400 font-mono">
                          TURN 3
                        </span>
                        <span className="font-mono text-zinc-300 text-xs">{heroSpot3}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400">Upcoming</span>
                    </div>
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-2">
                  <Link
                    href={`/vault/${heroAddress}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-white text-zinc-900 py-2.5 text-xs font-semibold transition-all shadow-sm"
                  >
                    <span>View Showcase Circle Ledger</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Protocol Architecture: 4 Core Pillars */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-zinc-800/80">
        <div className="max-w-2xl mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            System Architecture
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Engineered for Precision Capital Formation
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Combining traditional community rotating credit with cryptographic finality on Arc Mainnet.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* Pillar 1 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200">
              <RefreshCw className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Deterministic FIFO Queues</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Member payout order is set upon enrollment in an immutable FIFO state machine. Eliminates treasurer bias, embezzlement, and subjective delays.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-emerald-400">
              <Coins className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Native USDC Gas Economics</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Arc uses USDC as its native gas token. Contributions and sub-cent network transactions are calculated in real dollars with zero volatile gas slippage.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-cyan-400">
              <Sliders className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Emergency Credit & Bidding</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Participants can access liquidity advances up to 75% of pot size or place discount bids to accelerate their payout turn in emergency scenarios.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="rounded-2xl border border-zinc-800/80 bg-[#0e0e12] p-5 space-y-3 hover:border-zinc-700 transition-all">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-200">
              <TrendingUp className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-white">Float Yield Optimization</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Idle pool balances generate automated yield during cycle intervals, accumulating additional cooperative buffer for the group.
            </p>
          </div>

        </div>
      </section>

      {/* Institutional Comparison Table */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-zinc-800/80">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
            Mechanism Comparison
          </p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How GScoop Upgrades Collaborative Savings
          </h2>
          <p className="mt-2 text-sm text-zinc-400">
            Comparing informal peer groups and traditional dApps against Arc-native collaborative contracts.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-zinc-800/80 bg-[#0e0e12]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400">
                <th className="py-3.5 px-4 font-medium">Dimension</th>
                <th className="py-3.5 px-4 font-medium">Informal Offline Groups</th>
                <th className="py-3.5 px-4 font-medium">Legacy Web3 dApps</th>
                <th className="py-3.5 px-4 font-semibold text-white bg-emerald-500/5">GScoop on Arc Mainnet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Custody & Governance</td>
                <td className="py-3.5 px-4 text-zinc-400">Manual treasurer risk, physical cash loss</td>
                <td className="py-3.5 px-4 text-zinc-400">Multi-sig or rigid single-vault contracts</td>
                <td className="py-3.5 px-4 text-emerald-400 font-medium bg-emerald-500/5">
                  100% Non-custodial FIFO state machine
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Gas & Network Fees</td>
                <td className="py-3.5 px-4 text-zinc-400">Bank wire fees, cash conversion fees</td>
                <td className="py-3.5 px-4 text-zinc-400">Volatile ETH gas ($2 – $25/tx spikes)</td>
                <td className="py-3.5 px-4 text-emerald-400 font-medium bg-emerald-500/5">
                  Native USDC gas (~$0.005/tx)
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Settlement Latency</td>
                <td className="py-3.5 px-4 text-zinc-400">1 – 3 business days per cycle</td>
                <td className="py-3.5 px-4 text-zinc-400">15 – 60 seconds block confirmation</td>
                <td className="py-3.5 px-4 text-emerald-400 font-medium bg-emerald-500/5">
                  Sub-second deterministic finality
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Capital Efficiency</td>
                <td className="py-3.5 px-4 text-zinc-400">0% yield on idle deposits</td>
                <td className="py-3.5 px-4 text-zinc-400">Complex LP farming, impermanent loss</td>
                <td className="py-3.5 px-4 text-emerald-400 font-medium bg-emerald-500/5">
                  Automated 5.2% float yield integration
                </td>
              </tr>
              <tr>
                <td className="py-3.5 px-4 font-medium text-white">Liquidity Access</td>
                <td className="py-3.5 px-4 text-zinc-400">Strictly locked until allocated turn</td>
                <td className="py-3.5 px-4 text-zinc-400">Penalty slash for early exit</td>
                <td className="py-3.5 px-4 text-emerald-400 font-medium bg-emerald-500/5">
                  75% advance facility + turn bidding
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Featured Pools Preview */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 border-t border-zinc-800/80">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Verified Registry
            </p>
            <h2 className="text-2xl font-bold text-white mt-1">Active Cooperative Circles</h2>
          </div>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
          >
            <span>Browse all pools</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredVaults.map((vault) => (
            <VaultCard key={vault.address} vault={vault} />
          ))}
        </div>
      </section>

      {/* Deploy Contract CTA Banner */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-zinc-800 bg-[#0e0e12] p-8 sm:p-12 shadow-xl text-center sm:text-left">
          <div className="max-w-2xl space-y-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Ready to deploy a cooperative circle?
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Launch an immutable savings pool on Arc Mainnet in under 30 seconds. Set contribution amounts, cycle durations, member limits, and invite your circle.
            </p>
            <div className="pt-2">
              <Link
                href="/create"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-zinc-950 px-5 py-3 text-xs sm:text-sm font-semibold hover:bg-zinc-200 transition-all shadow-sm"
              >
                <span>Deploy Circle on Arc</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
