export interface FarcasterMemberProfile {
  address: string;
  username: string;
  displayName?: string;
  pfpUrl?: string;
}

const profileCache = new Map<string, FarcasterMemberProfile | null>();

/**
 * Resolves Farcaster profiles (@username + avatar) for 0x wallet addresses
 * using public Web3 profile resolution with in-memory caching.
 */
export async function resolveFarcasterProfiles(
  addresses: string[]
): Promise<Record<string, FarcasterMemberProfile>> {
  const unique = Array.from(new Set(addresses.map((a) => a.toLowerCase())));
  const result: Record<string, FarcasterMemberProfile> = {};

  await Promise.all(
    unique.map(async (addr) => {
      if (profileCache.has(addr)) {
        const cached = profileCache.get(addr);
        if (cached) result[addr] = cached;
        return;
      }

      try {
        const res = await fetch(`https://api.web3.bio/ns/farcaster/${addr}`, {
          headers: { Accept: 'application/json' },
        });
        if (!res.ok) {
          profileCache.set(addr, null);
          return;
        }
        const data = await res.json();
        const item = Array.isArray(data) ? data[0] : data;
        if (item && item.identity) {
          const profile: FarcasterMemberProfile = {
            address: addr,
            username: item.identity.replace(/^@/, ''),
            displayName: item.displayName || item.identity,
            pfpUrl: item.avatar || undefined,
          };
          profileCache.set(addr, profile);
          result[addr] = profile;
        } else {
          profileCache.set(addr, null);
        }
      } catch {
        profileCache.set(addr, null);
      }
    })
  );

  return result;
}
