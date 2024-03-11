import { useMemo, type PropsWithChildren } from "react";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { http, WagmiProvider } from "wagmi";
import * as wagmiChains from "wagmi/chains";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { ThemeProvider } from "next-themes";
import {
  RainbowKitSiweNextAuthProvider,
  type GetSiweMessageOptions,
} from "./RainbowKitSiweNextAuthProvider";

import * as appConfig from "~/config";
import { Toaster } from "~/components/Toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const getSiweMessageOptions: GetSiweMessageOptions = () => ({
  statement: process.env.NEXT_PUBLIC_SIGN_STATEMENT ?? "Sign in to OpenPGF",
});

export function Providers({
  children,
  session,
}: PropsWithChildren<{ session?: Session }>) {
  const { config, queryClient } = useMemo(() => createWagmiConfig(), []);

  return (
    <ThemeProvider attribute="class" forcedTheme={appConfig.theme.colorMode}>
      <SessionProvider refetchInterval={0} session={session}>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitSiweNextAuthProvider
              getSiweMessageOptions={getSiweMessageOptions}
            >
              <RainbowKitProvider>
                {children}
                <Toaster />
              </RainbowKitProvider>
            </RainbowKitSiweNextAuthProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}

function createWagmiConfig() {
  const activeChains: wagmiChains.Chain[] = [
    appConfig.config.network,
    wagmiChains.mainnet,
  ];

  if (process.env.NEXT_PUBLIC_CHAIN_NAME === "localhost") {
    wagmiChains.localhost.id = 31337;
    activeChains.push(wagmiChains.localhost);
  }

  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_ID!;
  const appName = appConfig.metadata.title;

  const queryClient = new QueryClient();

  const config = getDefaultConfig({
    appName,
    projectId,
    ssr: false,
    chains: activeChains as unknown as readonly [
      wagmiChains.Chain,
      ...wagmiChains.Chain[],
    ],
    transports: {
      [wagmiChains.mainnet.id]: http(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID!}`,
      ),
      [wagmiChains.sepolia.id]: http(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_ID!}`,
      ),
    },
  });

  return { config, queryClient };
}
