'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { CoopVaultData } from '@/lib/vaultStore';
import { formatAddress, formatDuration, formatTimeRemaining, formatUSDC } from '@/lib/utils';
import { Clock, Users, ArrowRight, ShieldCheck, Sparkles, CheckCircle2, Zap, Coins } from 'lucide-react';

interface VaultCardProps {
  vault: CoopVaultData;
}

export function VaultCard({ vault }: VaultCardProps) {
  const { address: userAddress } = useAccount();
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

  const isEnrolled = Boolean(
    userAddress && vault.members.some((m) => m.toLowerCase() === userAddress.toLowerCase())
  );
  const hasPaidCycle = Boolean(
    userAddress && vault.cyclePaidMembers?.[userAddress.toLowerCase()]
  );
  const isUserBeneficiary = Boolean(
    userAddress && vault.beneficiary.toLowerCase() === userAddress.toLowerCase()
  );

  return (
    <div className={`group relative flex flex-col justify-between rounded-2xl border p-5 sm:p-6 shadow-md transition-all duration-200 hover:shadow-xl ${
      isEnrolled
        ? 'border-emerald-500/30 bg-[#0e1012] hover:border-emerald-500/50 hover:bg-[#111417]'
        : 'border-zinc-800/90 bg-[#0d0d11] hover:border-zinc-700 hover:bg-[#111116]'
    }`}>
      
      {/* Top Header & Status */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white group-hover:text-emerald-300 transition-colors truncate">
                {vault.name}
              </h3>
            </div>
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {vault.description || 'Decentralized rotating savings cooperative on Arc Mainnet.'}
            </p>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
              isReadyForPayout
                ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isReadyForPayout ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
            />
            <span>{isReadyForPayout ? 'Payout Ready' : `Cycle #${vault.currentCycle.toString()}`}</span>
          </span>
        </div>

        {/* Feature & Enrollment Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {isEnrolled && (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
              <CheckCircle2 className="h-3 w-3" />
              <span>{isUserBeneficiary ? 'Your Turn' : 'Enrolled'}</span>
            </span>
          )}
          {isEnrolled && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium border ${
                hasPaidCycle
                  ? 'bg-zinc-800/70 border-zinc-700/60 text-zinc-300'
                  : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
              }`}
            >
              <span>
                {hasPaidCycle
                  ? `✓ Paid Cycle #${vault.currentCycle.toString()}`
                  : `Due Cycle #${vault.currentCycle.toString()}`}
              </span>
            </span>
          )}
          {vault.yieldEnabled && (
            <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
              <Zap className="h-3 w-3 text-emerald-400" />
              <span>{vault.yieldApy || 5.0}% APY Float</span>
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800/60 border border-zinc-700/50 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
            <ShieldCheck className="h-3 w-3 text-cyan-400" />
            <span>Turn-Credit</span>
          </span>
          {vault.currentHighestBid && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">
              <span>Bid: ${formatUSDC(vault.currentHighestBid.discountAmount)} Off</span>
            </span>
          )}
        </div>

        {/* Primary Financial Metric Box */}
        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-black/40 p-3.5 border border-zinc-800/80">
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Contribution / Cycle</p>
            <p className="text-base font-bold text-white font-mono tabular-nums mt-0.5">
              ${formatUSDC(vault.contributionAmount)}{' '}
              <span className="text-[11px] font-normal text-zinc-400">USDC</span>
            </p>
          </div>
          <div>
            <p className="text-[11px] text-zinc-400 font-medium">Cycle Cadence</p>
            <p className="text-xs font-semibold text-zinc-200 mt-1">
              Every {formatDuration(vault.cycleDuration)}
            </p>
          </div>
        </div>

        {/* Cycle Progress & Settlement Status */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">
              Cycle Confirmed Deposits
            </span>
            <span className="font-semibold text-zinc-200 font-mono tabular-nums">
              {vault.cycleDeposits.toString()} / {vault.memberCount.toString()} Paid
            </span>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/90">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${depositProgress}%` }}
            />
          </div>
        </div>

        {/* Schedule & Beneficiary Details */}
        <div className="mt-4 flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 border border-white/[0.04] text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-400" />
              Cycle Deadline:
            </span>
            <span className={`font-mono text-xs tabular-nums ${timeInfo.isExpired ? 'text-amber-400 font-semibold' : 'text-zinc-300'}`}>
              {timeInfo.formatted}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-zinc-400" />
              Current Beneficiary:
            </span>
            <span className="font-mono text-xs text-emerald-400 font-medium">
              {formatAddress(vault.beneficiary)}
            </span>
          </div>

          {vault.reserveFund > BigInt(0) && (
            <div className="flex items-center justify-between pt-1.5 border-t border-white/[0.04] text-[11px]">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Coins className="h-3 w-3 text-cyan-400" />
                Reserve Credit Facility:
              </span>
              <span className="font-mono text-cyan-400 font-semibold tabular-nums">
                ${formatUSDC(vault.reserveFund)} USDC
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer & Action Button */}
      <div className="mt-5 pt-3.5 border-t border-zinc-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
          <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
          <span>Non-Custodial</span>
        </div>

        <Link
          href={`/vault/${vault.address}`}
          className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
            isEnrolled && !hasPaidCycle
              ? 'bg-emerald-500 text-black hover:bg-emerald-400 shadow-sm shadow-emerald-500/20'
              : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700/60'
          }`}
        >
          <span>{isEnrolled ? (hasPaidCycle ? 'Manage Circle' : 'Pay Cycle Due') : 'View Pool'}</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
