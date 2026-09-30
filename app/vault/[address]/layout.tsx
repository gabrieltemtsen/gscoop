import type { Metadata } from 'next';
import { fetchOnChainVault } from '@/lib/onChainVaults';
import { formatDuration, formatUSDC } from '@/lib/utils';

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://gscoop.xyz'
).replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ address: string }>;
}): Promise<Metadata> {
  const { address } = await params;
  const vaultUrl = `${APP_URL}/vault/${address}`;
  const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;

  let vaultTitle = `Savings Circle (${shortAddr})`;
  let vaultDesc = `Join this collaborative USDC savings circle (${shortAddr}) on Arc Mainnet.`;
  let buttonTitle = 'Join Savings Circle';

  try {
    const vault = await fetchOnChainVault(address as `0x${string}`, false);
    if (vault) {
      const contrib = formatUSDC(vault.contributionAmount);
      const freq = formatDuration(vault.cycleDuration);
      vaultTitle = `${vault.name} ($${contrib} USDC / ${freq})`;
      vaultDesc = `Join ${vault.name} on Arc Mainnet — $${contrib} USDC per ${freq} cycle (${vault.memberCount.toString()} members enrolled).`;
      buttonTitle = `Join ($${contrib} USDC)`.slice(0, 32);
    }
  } catch {
    // Fallback to default metadata
  }

  const dynamicOgUrl = `${APP_URL}/api/og/vault/${address}`;

  const miniAppEmbed = {
    version: '1',
    imageUrl: dynamicOgUrl,
    button: {
      title: buttonTitle,
      action: {
        type: 'launch_miniapp',
        name: 'GScoop',
        url: vaultUrl,
        splashImageUrl: `${APP_URL}/farcaster-splash.png`,
        splashBackgroundColor: '#09090b',
      },
    },
  };

  const frameEmbed = {
    ...miniAppEmbed,
    button: {
      ...miniAppEmbed.button,
      action: {
        ...miniAppEmbed.button.action,
        type: 'launch_frame',
      },
    },
  };

  return {
    title: `${vaultTitle} | GScoop on Arc`,
    description: vaultDesc,
    openGraph: {
      title: vaultTitle,
      description: vaultDesc,
      images: [dynamicOgUrl],
    },
    other: {
      'fc:miniapp': JSON.stringify(miniAppEmbed),
      'fc:frame': JSON.stringify(frameEmbed),
    },
  };
}

export default function VaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
