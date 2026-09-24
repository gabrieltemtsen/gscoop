import type { Metadata } from 'next';

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

  const miniAppEmbed = {
    version: '1',
    imageUrl: `${APP_URL}/farcaster-embed.png`,
    button: {
      title: 'Join Savings Circle',
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
    title: `Savings Circle (${shortAddr}) | GScoop on Arc`,
    description: `Join this collaborative USDC savings circle (${shortAddr}) on Arc Mainnet.`,
    openGraph: {
      title: `GScoop Savings Circle (${shortAddr})`,
      description: `Save and grow native USDC together on Arc Mainnet.`,
      images: [`${APP_URL}/farcaster-og.png`],
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
