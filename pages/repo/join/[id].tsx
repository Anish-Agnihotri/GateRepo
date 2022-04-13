import axios from "axios"; // Requests
import Link from "next/link"; // Routing
import { useState } from "react"; // State management
import Meta from "components/Meta"; // Meta
import { toast } from "react-toastify"; // Toast notifications
import { bufferToHex } from "ethereumjs-util"; // Utils: Buffer => Hex
import styles from "styles/pages/Join.module.scss"; // Page styles
import { getSession, useSession } from "next-auth/react"; // Auth
import { getGate, GateExtended } from "pages/api/gates/access"; // Gate details
import layoutStyles from "styles/components/Layout.module.scss"; // Layout override styles
import { Authenticated, Unauthenticated } from "components/Layout"; // Auth components

// Web3
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { WalletConnectConnector } from "@web3-react/walletconnect-connector";

export default function Join({ gate }: { gate: GateExtended }) {
  // Collect authenticated session
  const { data: session } = useSession();
  // Join loading
  const [joinLoading, setJoinLoading] = useState<boolean>(false);
  // Web3React connection
  const [connectionStarted, setConnectionStarted] = useState<boolean>(false);
  // Web3React setup
  const { active, account, activate, deactivate, library } = useWeb3React();
  const domain = process.env.NEXT_PUBLIC_URL;

  // Templated content
  const templateDescription: string = gate.creator.name
    ? // If creator name not null, personalize invitation
      `${gate.creator.name} has invited you to join their private @${gate.repoOwner}/${gate.repoName} repository.`
    : // Else, generalize invitation
      `You have been invited to join the private @${gate.repoOwner}/${gate.repoName} repository.`;

  /**
   * Formats number to us-en format (commas)
   * @param {number} num to format
   * @returns {string} formatted number
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString("us-en");
  };

  /**
   * Connect metamask
   */
  const connectMetaMask = () => {
    setConnectionStarted(true);
    activate(
      new InjectedConnector({
        supportedChainIds: [1],
      })
    );
    setConnectionStarted(false);
  };

  /**
   * Connect WalletConnect
   */
  const connectWalletConnect = () => {
    setConnectionStarted(true);
    activate(
      new WalletConnectConnector({
        rpc: { 1: process.env.NEXT_PUBLIC_RPC ?? "" },
      })
    );
    setConnectionStarted(false);
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    deactivate();
    setConnectionStarted(false);
  };

  /**
   * Join private repository
   */
  const joinRepo = async () => {
    setJoinLoading(true); // Toggle loading

    // Generate message to sign
    const message: string = bufferToHex(
      Buffer.from(`GateRepo: Verifying my address is ${account}`)
    );

    let signature: string | null = null;
    try {
      // Request signature from wallet
      signature = await library.send("personal_sign", [message, account]);
    } catch (e) {
      // Throw error if user denied
      console.error(e);
      toast.error("Error: could not verify Ethereum account.");
    }

    // Revert if no signature
    if (!signature) {
      setJoinLoading(false); // Toggle loading
      return;
    }

    try {
      // Post data to access
      await axios.post("/api/gates/access", {
        address: account,
        signature,
        gateId: gate.id,
        readOnly: gate.readOnly,
      });

      // If successful, toast and redirect
      toast.success("Successfully joined private repository. Redirecting...");
      setTimeout(() => {
        window.location.href = `https://github.com/${gate.repoOwner}/${gate.repoName}`;
      }, 2000);
    } catch (e: any) {
      // If error message, toast
      if (e?.response.data.error) {
        toast.error(`Error: ${e.response.data.error}`);
      }
      // Else, log all errors
      console.error(e);
      setJoinLoading(false); // Toggle loading
    }

    setJoinLoading(false); // Toggle loading
  };

  return (
    <div className={layoutStyles.layout}>
      {/* Meta tags */}
      <Meta
        title={`GateRepo - @${gate.repoOwner}/${gate.repoName}`}
        description={templateDescription}
        url={`${domain}/repo/join/${gate.id}`}
      />

      {/* Logo */}
      <Link href="/">
        <a>
          <img src="/logo.svg" alt="logo" />
        </a>
      </Link>

      <div className={styles.join}>
        {/* Description */}
        <h2>Private Repo Invitation</h2>
        <p>{templateDescription}</p>

        {session && session.user.id && (
          // If authenticated, allow connecting wallet
          <div className={styles.join__wallet}>
            <h3>{!active ? "Connect Wallet" : "Join Repository"}</h3>
            <p>
              Accessing this repository requires having held{" "}
              {formatNumber(gate.numTokens)}{" "}
              <a
                href={`https://etherscan.io/token/${gate.contract}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {gate.contractName}
              </a>{" "}
              token{gate.numTokens == 1 ? "" : "s"} at block{" "}
              <a
                href={`https://etherscan.io/block/${gate.blockNumber}`}
                target="_blank;"
                rel="noopener noreferrer"
              >
                #{formatNumber(gate.blockNumber)}
              </a>
              .
            </p>

            {/* Connect wallet */}
            {!active ? (
              // Not active
              <div className={styles.join__buttons_inactive}>
                <button
                  onClick={() => connectMetaMask()}
                  disabled={connectionStarted}
                >
                  Connect MetaMask
                </button>
                <button
                  onClick={() => connectWalletConnect()}
                  disabled={connectionStarted}
                >
                  Connect WalletConnect
                </button>
              </div>
            ) : (
              // Connected
              <div className={styles.join__buttons_active}>
                <button onClick={() => joinRepo()} disabled={joinLoading}>
                  {joinLoading
                    ? "Accepting Invitation..."
                    : "Accept Invitation"}
                </button>
                <button onClick={() => disconnectWallet()}>
                  Disconnect{" "}
                  {account?.substr(0, 6) +
                    "..." +
                    account?.slice(account?.length - 4)}
                </button>
              </div>
            )}
          </div>
        )}

        {/* GitHub Authentication state */}
        {!session || !session.user.id ? (
          // Unauthenticated
          <Unauthenticated />
        ) : (
          // Authenticated
          <Authenticated session={session} />
        )}
      </div>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  // Collect session
  const session = await getSession(context);
  // Collect gate id from URL
  const { id }: { id: string } = context.query;

  try {
    // Throw if params not present
    if (!id) throw new Error();

    // Collect gate or throw
    const gate: GateExtended | null = await getGate(id);
    if (!gate) throw new Error();

    // Validation
    const hasEmptyInvites: boolean = gate.numInvites - gate.usedInvites > 0;
    if (!hasEmptyInvites) throw new Error();

    return {
      props: {
        gate,
        session,
      },
    };
  } catch {
    // On error, redirect
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }
}
