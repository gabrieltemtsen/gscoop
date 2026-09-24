import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { AppShell } from '@/components/AppShell';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL ||
  'https://gscoop.xyz'
).replace(/\/$/, '');

const miniAppEmbed = {
  version: '1',
  imageUrl: `${APP_URL}/farcaster-embed.png`,
  button: {
    title: 'Launch GScoop',
    action: {
      type: 'launch_miniapp',
      name: 'GScoop',
      url: APP_URL,
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

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: 'GScoop | Decentralized Cooperative Savings on Arc Mainnet',
  description:
    'Trust-minimized decentralized cooperative savings platform (Rotating Savings Circles / ROSCA) with native USDC gas fees on Arc Mainnet.',
  openGraph: {
    title: 'GScoop | Cooperative USDC Savings on Arc Mainnet',
    description:
      'Automated rotating savings circles and collaborative lending pools with native USDC on Arc Mainnet.',
    images: [`${APP_URL}/farcaster-og.png`],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'fc:miniapp': JSON.stringify(miniAppEmbed),
    'fc:frame': JSON.stringify(frameEmbed),
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen bg-[#09090b] font-sans">
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
