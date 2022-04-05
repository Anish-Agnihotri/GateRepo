import axios from "axios"; // Requests
import Link from "next/link";
import { ethers } from "ethers"; // Ethers
import { useState } from "react"; // State management
import { toast } from "react-toastify"; // Toast notifications
import { getSession, useSession } from "next-auth/react"; // Auth
import { getGate } from "pages/api/gates/access"; // Gate details
import styles from "styles/pages/Join.module.scss"; // Page styles
import layoutStyles from "styles/components/Layout.module.scss"; // Layout override styles

// Types
import type { Gate } from "@prisma/client";

export default function Join({ gate }: { gate: Gate }) {
  // Collect authenticated session
  const { data: session } = useSession();

  console.log(gate);

  // Validation
  const hasEmptyInvites: boolean = gate.numInvites - gate.usedInvites > 0;

  return (
    <div className={layoutStyles.layout}>
      {/* Logo */}
      <Link href="/">
        <a>
          <img src="/logo.svg" alt="logo" />
        </a>
      </Link>

      <div className={styles.join}>
        <h3>
          You are invited to join @{gate.repoOwner}/{gate.repoName}
        </h3>

        <div>
          <p>Test</p>
        </div>
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
    const gate: Gate | null = await getGate(id);
    if (!gate) throw new Error();

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
