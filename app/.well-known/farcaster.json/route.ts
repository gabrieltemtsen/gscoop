import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Support Farcaster Hosted Manifests if configured
  const hostedManifestId = process.env.FARCASTER_HOSTED_MANIFEST_ID;
  if (hostedManifestId) {
    return NextResponse.redirect(
      `https://api.farcaster.xyz/miniapps/hosted-manifest/${hostedManifestId}`,
      307
    );
  }

  const appUrl = (
    process.env.NEXT_PUBLIC_APP_URL ||
    request.nextUrl.origin ||
    'https://gscoop.vercel.app'
  ).replace(/\/$/, '');

  const appConfig = {
    version: '1',
    name: 'GScoop',
    iconUrl: `${appUrl}/farcaster-icon.png`,
    homeUrl: appUrl,
    imageUrl: `${appUrl}/farcaster-embed.png`,
    buttonTitle: 'Launch GScoop',
    splashImageUrl: `${appUrl}/farcaster-splash.png`,
    splashBackgroundColor: '#09090b',
    subtitle: 'Cooperative USDC Savings',
    description:
      'Automated rotating savings circles and collaborative lending pools with native USDC on Arc Mainnet',
    primaryCategory: 'finance',
    tags: ['savings', 'usdc', 'defi', 'rosca', 'arc'],
    tagline: 'Save and grow USDC together',
    ogTitle: 'GScoop Protocol',
    ogDescription:
      'Trust-minimized rotating savings circles with native USDC on Arc Mainnet',
    ogImageUrl: `${appUrl}/farcaster-og.png`,
    heroImageUrl: `${appUrl}/farcaster-og.png`,
  };

  const manifest: Record<string, unknown> = {
    accountAssociation: {
      header:
        process.env.FARCASTER_HEADER ||
        'eyJmaWQiOjEsInR5cGUiOiJjdXN0b2R5Iiwia2V5IjoiMHhmYXJjYXN0ZXIifQ',
      payload:
        process.env.FARCASTER_PAYLOAD ||
        Buffer.from(
          JSON.stringify({ domain: new URL(appUrl).hostname })
        ).toString('base64url'),
      signature: process.env.FARCASTER_SIGNATURE || '0x',
    },
    miniapp: appConfig,
    frame: appConfig,
  };

  return NextResponse.json(manifest, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
