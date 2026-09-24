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
    'https://gscoop.xyz'
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
        'eyJmaWQiOjQyMDU2NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweGREOGVFNTU1NTc0NGQ2ODQyZTNjNTcyZTQ2RjQyMDkyZWQ3MzI2YjYifQ',
      payload:
        process.env.FARCASTER_PAYLOAD ||
        'eyJkb21haW4iOiJnc2Nvb3AueHl6In0',
      signature:
        process.env.FARCASTER_SIGNATURE ||
        '6P0+w4vnpw0XKV84vYbdd1CRIAdPEd0ZNCZMTBEFpgMciQ+cXOmSQLGThMBkzuK/Hu73Z0wwwCV61BY7GoPaDxw=',
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

