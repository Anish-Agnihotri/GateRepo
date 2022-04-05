import "styles/global.scss"; // Global styles
import "react-toastify/dist/ReactToastify.css"; // Toast styles
import NextNProgress from "nextjs-progressbar"; // Progress bar
import { ToastContainer } from "react-toastify"; // Toast container
import { SessionProvider } from "next-auth/react"; // Session wrapper

// Types
import type { AppProps } from "next/app";

export default function GateRepo({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  return (
    // Wrap page in session provider
    <SessionProvider session={session}>
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
    </SessionProvider>
  );
}
