import Link from "next/link";
import styles from "styles/components/Layout.module.scss"; // Component styles
import { useSession, signIn, signOut } from "next-auth/react"; // Auth

// Types
import type { ReactElement } from "react";
import { Session } from "next-auth";

// Layout wrapper
export default function Layout({
  children,
}: {
  children: ReactElement | ReactElement[];
}) {
  // Collect authenticated session
  const { data: session } = useSession();

  return (
    <div className={styles.layout}>
      {/* Logo */}
      <Link href="/">
        <a>
          <img src="/logo.svg" alt="logo" />
        </a>
      </Link>

      {!session ? (
        // If unauthenticated, display unauthenticated
        <Unauthenticated />
      ) : (
        // If authentiated:
        <div className={styles.layout__main}>
          {/* Render children */}
          <div>{children}</div>

          {/* Auth status */}
          <Authenticated session={session} />
        </div>
      )}

      <Credits />
    </div>
  );
}

// Sign in state
function Unauthenticated() {
  return (
    <div className={styles.layout__unauthenticated}>
      <p>
        GateRepo is a simple way to <strong>token gate</strong> access to
        private GitHub repositories.
      </p>
      <button onClick={() => signIn("github")}>Sign in with GitHub</button>
    </div>
  );
}

// Authenticated state
export function Authenticated({ session }: { session: Session }) {
  return (
    <div className={styles.layout__main_auth}>
      <div>
        <img
          src={
            // GitHub image or identicon
            session.user.image ??
            `https://github.com/identicons/${session.user.id}.png`
          }
          alt="Avatar"
        />
        <h3>{session.user.name}</h3>
      </div>

      {/* Name + Sign out */}
      <div>
        <button onClick={() => signOut()}>Sign out</button>
      </div>
    </div>
  );
}

// Credits
export function Credits() {
  return (
    <div className={styles.layout__credit}>
      <p>
        A quick{" "}
        <a
          href="https://github.com/anish-agnihotri/gaterepo"
          target="_blank"
          rel="noopener noreferrer"
        >
          hack
        </a>{" "}
        by{" "}
        <a
          href="https://anishagnihotri.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Anish Agnihotri
        </a>
        .
      </p>
    </div>
  );
}
