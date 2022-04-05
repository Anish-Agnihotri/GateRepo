import axios from "axios"; // Requests
import Link from "next/link";
import { ethers } from "ethers"; // Ethers
import { useState } from "react"; // State management
import { toast } from "react-toastify"; // Toast notifications
import { getSession, useSession } from "next-auth/react"; // Auth
import { getGate, GateExtended } from "pages/api/gates/access"; // Gate details
import styles from "styles/pages/Join.module.scss"; // Page styles
import layoutStyles from "styles/components/Layout.module.scss"; // Layout override styles
import { Authenticated, Unauthenticated } from "components/Layout";

export default function Join({ gate }: { gate: GateExtended }) {
  // Collect authenticated session
  const { data: session } = useSession();

  console.log(session);

  console.log(gate);

  return (
    <div className={layoutStyles.layout}>
      {/* Logo */}
      <Link href="/">
        <a>
          <img src="/logo.svg" alt="logo" />
        </a>
      </Link>

      <div className={styles.join}>
        {/* Description */}
        <h2>Private Repo Invitation</h2>
        <p>
          {gate.creator.name
            ? `${gate.creator.name} has invited you to join their private @${gate.repoOwner}/${gate.repoName} repository.`
            : "You have been invited to join the private @${gate.repoOwner}/${gate.repoName} repository."}
        </p>

        {session && session.user.id && (
          // If authenticated, allow connecting wallet
          <div>
            <h2>Connect &amp; Join</h2>
            <p>
              Accessing this repository requires holding {gate.numTokens} ERC20
              token{gate.numTokens == 1 ? "" : "s"}.
            </p>
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
