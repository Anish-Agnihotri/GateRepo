import "styles/global.scss"; // Global styles
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
      <Component {...pageProps} />
    </SessionProvider>
  );
}
