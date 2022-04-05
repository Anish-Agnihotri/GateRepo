import "styles/global.scss"; // Global styles
import { providers } from "ethers"; // Ethers provider
import "react-toastify/dist/ReactToastify.css"; // Toast styles
import NextNProgress from "nextjs-progressbar"; // Progress bar
import { ToastContainer } from "react-toastify"; // Toast container
import { SessionProvider } from "next-auth/react"; // Session wrapper
import { Web3ReactProvider } from "@web3-react/core"; // Web3 provider

// Types
import type { AppProps } from "next/app";

/**
 * Returns instantiated Ethers provider
 * @param provider from Web3React
 * @returns {providers.Web3Provider} ethers provider
 */
function getLibrary(provider: any): providers.Web3Provider {
  return new providers.Web3Provider(provider);
}

export default function GateRepo({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    // Wrap page in session provider
    <SessionProvider session={session}>
      {/* Wrap page in Web3 provider */}
      <Web3ReactProvider getLibrary={getLibrary}>
        {/* Progress bar */}
        <NextNProgress
          color="#24292f"
          startPosition={0.3}
          showOnShallow={true}
          options={{ showSpinner: false }}
        />

        {/* Page content */}
        <Component {...pageProps} />

        {/* Toast notifications */}
        <ToastContainer />
      </Web3ReactProvider>
    </SessionProvider>
  );
}
