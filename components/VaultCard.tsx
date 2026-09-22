'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CoopVaultData } from '@/lib/vaultStore';
import { formatAddress, formatDuration, formatTimeRemaining, formatUSDC } from '@/lib/utils';
import { Clock, Users, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Zap, Coins } from 'lucide-react';

interface VaultCardProps {
  vault: CoopVaultData;
}

export function VaultCard({ vault }: VaultCardProps) {
  const [timeInfo, setTimeInfo] = useState(() => formatTimeRemaining(vault.cycleDeadline));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeInfo(formatTimeRemaining(vault.cycleDeadline));
    }, 1000);
    return () => clearInterval(timer);
  }, [vault.cycleDeadline]);

  const depositProgress = vault.memberCount > 0 
    ? Math.min(100, Math.round((Number(vault.cycleDeposits) / Number(vault.memberCount)) * 100))
    : 0;

  const isFull = vault.maxMembers > 0 && vault.memberCount >= vault.maxMembers;
  const isReadyForPayout = timeInfo.isExpired || (vault.memberCount > 0 && vault.cycleDeposits >= vault.memberCount);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#121215] p-6 shadow-xl transition-all duration-300 hover:border-white/20 hover:bg-[#15151a] hover:shadow-2xl hover:shadow-emerald-500/5">
      
      {/* Top Header & Status */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
                {vault.name}
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {vault.description || 'Decentralized rotating savings cooperative on Arc Mainnet.'}
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
              isReadyForPayout
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/25'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
            }`}
          >
            {isReadyForPayout ? 'Payout Ready' : 'Active Cycle'}
          </span>
        </div>

        {/* Feature Badges: Yield Float & Credit Availability */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {vault.yieldEnabled && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <Zap className="h-3 w-3" />
              <span>{vault.yieldApy || 5.0}% APY Float</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
            <ShieldCheck className="h-3 w-3" />
            <span>Turn-Credit Active</span>
          </span>
          {vault.currentHighestBid && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
              <span>Bid: ${formatUSDC(vault.currentHighestBid.discountAmount)} Off</span>
            </span>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-black/40 p-3.5 border border-white/[0.05]">
          <div>
            <p className="text-[11px] text-zinc-400">Contribution / Cycle</p>
            <p className="text-base font-bold text-emerald-400 font-mono">
              ${formatUSDC(vault.contributionAmount)}{' '}
              <span className="text-xs font-normal text-zinc-400">USDC</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400">Cycle Frequency</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              Every {formatDuration(vault.cycleDuration)}
            </p>
          </div>
        </div>

        {/* Progress & Cycle Info */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">
              Cycle #{vault.currentCycle.toString()} Deposits
            </span>
            <span className="font-semibold text-zinc-200 font-mono">
              {vault.cycleDeposits.toString()} / {vault.memberCount.toString()} Paid
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-500"
              style={{ width: `${depositProgress}%` }}
            />
          </div>
        </div>

        {/* Queue & Turn Info */}
        <div className="mt-4 flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 border border-white/[0.04] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              Time Remaining:
            </span>
            <span className={`font-mono font-medium ${timeInfo.isExpired ? 'text-amber-400 font-semibold' : 'text-zinc-300'}`}>
              {timeInfo.formatted}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              Current Beneficiary:
            </span>
            <span className="font-mono text-emerald-400 font-medium">
              {formatAddress(vault.beneficiary)}
            </span>
          </div>

          {vault.reserveFund > BigInt(0) && (
            <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Coins className="h-3 w-3 text-cyan-400" />
                Reserve / Credit Pool:
              </span>
              <span className="font-mono text-cyan-400 font-semibold">
                ${formatUSDC(vault.reserveFund)} USDC
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Action Button */}
      <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>Auto-Garnished Debt</span>
        </div>

        <Link
          href={`/vault/${vault.address}`}
          className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-white/[0.15] hover:text-emerald-300 transition-all group-hover:translate-x-0.5"
        >
          <span>Enter Pool</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
