import { ImageResponse } from 'next/og';
import { fetchOnChainVault } from '@/lib/onChainVaults';
import { formatDuration, formatUSDC } from '@/lib/utils';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params;
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  let vaultName = `Savings Circle (${shortAddr})`;
  let contributionDisplay = '10.00';
  let potDisplay = '50.00';
  let frequencyDisplay = '7 days';
  let membersDisplay = 'Active Pool';
  let cycleDisplay = 'Cycle #1';

  try {
    const vault = await fetchOnChainVault(address as `0x${string}`, false);
    if (vault) {
      vaultName = vault.name || vaultName;
      contributionDisplay = formatUSDC(vault.contributionAmount);
      const effectiveMax =
        Number(vault.maxMembers) > 0
          ? Number(vault.maxMembers)
          : Math.max(Number(vault.memberCount), 5);
      const potBig = vault.contributionAmount * BigInt(effectiveMax);
      potDisplay = formatUSDC(potBig);
      frequencyDisplay = formatDuration(vault.cycleDuration);
      membersDisplay =
        Number(vault.maxMembers) > 0
          ? `${vault.memberCount.toString()} / ${vault.maxMembers.toString()} Members`
          : `${vault.memberCount.toString()} Members Enrolled`;
      cycleDisplay = `Cycle #${vault.currentCycle.toString()} (${vault.cycleDeposits.toString()}/${vault.memberCount.toString()} Paid)`;
    }
  } catch {
    // Fallback to defaults if RPC times out
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '800px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          backgroundImage:
            'radial-gradient(circle at 15% 15%, rgba(16, 185, 129, 0.18), transparent 45%), radial-gradient(circle at 85% 80%, rgba(6, 182, 212, 0.16), transparent 45%)',
          padding: '64px',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Row: Brand & Live Network Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #10b981, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                fontSize: '28px',
                fontWeight: 900,
              }}
            >
              G
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                GScoop
              </span>
              <span style={{ fontSize: '15px', color: '#a1a1aa' }}>
                Rotating Savings Circles on Arc
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 22px',
              borderRadius: '999px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            <span>● Arc Mainnet • {shortAddr}</span>
          </div>
        </div>

        {/* Center: Vault Name & Subtitle */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            marginTop: '12px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              color: '#22d3ee',
              fontSize: '20px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            <span>Verified Smart Contract Savings Pool • {cycleDisplay}</span>
          </div>
          <div
            style={{
              fontSize: '64px',
              fontWeight: 900,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              lineHeight: 1.08,
            }}
          >
            {vaultName.length > 34 ? `${vaultName.slice(0, 34)}...` : vaultName}
          </div>
        </div>

        {/* Metrics Row */}
        <div
          style={{
            display: 'flex',
            gap: '24px',
            width: '100%',
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '28px 32px',
              borderRadius: '24px',
              backgroundColor: '#121216',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '18px', color: '#a1a1aa', fontWeight: 600 }}>
              Contribution / Turn
            </span>
            <span
              style={{
                fontSize: '44px',
                fontWeight: 900,
                color: '#34d399',
                marginTop: '8px',
              }}
            >
              ${contributionDisplay} USDC
            </span>
            <span style={{ fontSize: '16px', color: '#71717a', marginTop: '4px' }}>
              Every {frequencyDisplay}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '28px 32px',
              borderRadius: '24px',
              backgroundColor: '#121216',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '18px', color: '#a1a1aa', fontWeight: 600 }}>
              Target Cycle Payout
            </span>
            <span
              style={{
                fontSize: '44px',
                fontWeight: 900,
                color: '#22d3ee',
                marginTop: '8px',
              }}
            >
              ${potDisplay} USDC
            </span>
            <span style={{ fontSize: '16px', color: '#71717a', marginTop: '4px' }}>
              100% On-Chain Settlement
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              padding: '28px 32px',
              borderRadius: '24px',
              backgroundColor: '#121216',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span style={{ fontSize: '18px', color: '#a1a1aa', fontWeight: 600 }}>
              Circle Enrollment
            </span>
            <span
              style={{
                fontSize: '38px',
                fontWeight: 900,
                color: '#ffffff',
                marginTop: '12px',
              }}
            >
              {membersDisplay}
            </span>
            <span style={{ fontSize: '16px', color: '#34d399', marginTop: '6px' }}>
              Native USDC Gas (~$0.005)
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 800,
    }
  );
}
