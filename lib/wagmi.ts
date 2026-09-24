import { http, createConfig } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { mainnet, sepolia } from 'wagmi/chains';
import { farcasterMiniApp as miniAppConnector } from '@farcaster/miniapp-wagmi-connector';
import { arcMainnet } from './arcChain';

export const config = createConfig({
  chains: [arcMainnet, mainnet, sepolia],
  connectors: [
    miniAppConnector(),
    injected({
      target: 'metaMask',
    }),
    injected(),
  ],
  transports: {
    [arcMainnet.id]: http('https://rpc.mainnet.arc.io', {
      batch: true,
    }),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

