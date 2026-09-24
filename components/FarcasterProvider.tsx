'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterUser {
  fid: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface FarcasterContextType {
  isLoaded: boolean;
  isInMiniApp: boolean;
  user: FarcasterUser | null;
  isAdded: boolean;
  shareCast: (text: string, embedUrl?: string) => Promise<void>;
  addMiniApp: () => Promise<void>;
  openExternalUrl: (url: string) => Promise<void>;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isLoaded: false,
  isInMiniApp: false,
  user: null,
  isAdded: false,
  shareCast: async () => {},
  addMiniApp: async () => {},
  openExternalUrl: async () => {},
});

export function FarcasterProvider({ children }: { children: React.ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInMiniApp, setIsInMiniApp] = useState(false);
  const [user, setUser] = useState<FarcasterUser | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function initFarcaster() {
      try {
        // Check if running inside a Farcaster Mini App host
        const inMiniApp = await sdk.isInMiniApp();
        if (!mounted) return;
        setIsInMiniApp(inMiniApp);

        if (inMiniApp) {
          const context = await sdk.context;
          if (mounted && context) {
            if (context.user) {
              setUser({
                fid: context.user.fid,
                username: context.user.username,
                displayName: context.user.displayName,
                pfpUrl: context.user.pfpUrl,
              });
            }
            if (context.client) {
              setIsAdded(Boolean(context.client.added));
            }
          }
        }

        // Always signal ready() so Farcaster hides the splash screen
        await sdk.actions.ready();
      } catch (err) {
        // Safely ignore when running in a normal browser
        console.debug('Farcaster MiniApp SDK init skipped (standard browser mode):', err);
      } finally {
        if (mounted) {
          setIsLoaded(true);
        }
      }
    }

    initFarcaster();

    return () => {
      mounted = false;
    };
  }, []);

  const shareCast = useCallback(
    async (text: string, embedUrl?: string) => {
      try {
        if (isInMiniApp) {
          await sdk.actions.composeCast({
            text,
            embeds: embedUrl ? [embedUrl] : undefined,
          });
          return;
        }
      } catch (err) {
        console.warn('sdk.actions.composeCast fallback to web:', err);
      }

      // Web fallback: open Farcaster cast composer intent URL
      const composeUrl = new URL('https://farcaster.xyz/~/compose');
      composeUrl.searchParams.set('text', text);
      if (embedUrl) {
        composeUrl.searchParams.append('embeds[]', embedUrl);
      }
      window.open(composeUrl.toString(), '_blank', 'noopener,noreferrer');
    },
    [isInMiniApp]
  );

  const addMiniApp = useCallback(async () => {
    try {
      await sdk.actions.addMiniApp();
      setIsAdded(true);
    } catch (err) {
      console.warn('Could not add Mini App:', err);
    }
  }, []);

  const openExternalUrl = useCallback(
    async (url: string) => {
      try {
        if (isInMiniApp) {
          await sdk.actions.openUrl(url);
          return;
        }
      } catch (err) {
        console.warn('sdk.actions.openUrl fallback:', err);
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [isInMiniApp]
  );

  return (
    <FarcasterContext.Provider
      value={{
        isLoaded,
        isInMiniApp,
        user,
        isAdded,
        shareCast,
        addMiniApp,
        openExternalUrl,
      }}
    >
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcaster() {
  return useContext(FarcasterContext);
}
