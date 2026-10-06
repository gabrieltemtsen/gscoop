import { CoopVaultData } from './vaultStore';
import { formatDuration, formatUSDC } from './utils';

export function exportVaultStatementCSV(vault: CoopVaultData) {
  const lines: string[] = [];

  // Metadata Section
  lines.push('GSCOOP COOPERATIVE CIRCLE FINANCIAL STATEMENT');
  lines.push(`Generated On,${new Date().toISOString()}`);
  lines.push(`Circle Name,"${vault.name.replace(/"/g, '""')}"`);
  lines.push(`Contract Address,${vault.address}`);
  lines.push(`Network,Arc Mainnet (Chain ID: 5042)`);
  lines.push(`Creator,${vault.creator}`);
  lines.push(`Creation Date,${new Date(vault.createdAt).toISOString()}`);
  lines.push('');

  // Key Financial Parameters
  lines.push('FINANCIAL SPECIFICATIONS');
  lines.push(`Contribution / Turn,$${formatUSDC(vault.contributionAmount)} USDC`);
  lines.push(`Rotation Cadence,Every ${formatDuration(vault.cycleDuration)}`);
  lines.push(`Current Active Cycle,#${vault.currentCycle.toString()}`);
  lines.push(`Total Confirmed Deposits in Cycle,${vault.cycleDeposits.toString()} / ${vault.memberCount.toString()}`);
  lines.push(`Active Pooled Balance,$${formatUSDC(vault.balance)} USDC`);
  lines.push(`Reserve Credit Fund,$${formatUSDC(vault.reserveFund)} USDC`);
  lines.push(`Yield Float APY,${vault.yieldEnabled ? `${vault.yieldApy || 5.2}%` : 'Disabled'}`);
  lines.push('');

  // Member Queue Ledger
  lines.push('QUEUE ROTATION SCHEDULE & MEMBER LEDGER');
  lines.push('Turn Position,Member Address,Cycle Payment Status,Is Current Beneficiary');

  vault.members.forEach((memberAddr, index) => {
    const isCurrentBeneficiary =
      vault.beneficiary.toLowerCase() === memberAddr.toLowerCase();
    const hasPaid = Boolean(vault.cyclePaidMembers?.[memberAddr.toLowerCase()]);
    lines.push(
      `Turn #${index + 1},${memberAddr},${hasPaid ? 'PAID' : 'PENDING DUE'},${
        isCurrentBeneficiary ? 'YES (CURRENT RECIPIENT)' : 'NO'
      }`
    );
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const sanitizedName = vault.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  link.setAttribute('download', `${sanitizedName}_statement.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
