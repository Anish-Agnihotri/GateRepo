import styles from "styles/components/Layout.module.scss"; // Component styles
import { useSession, signIn, signOut } from "next-auth/react"; // Auth

// Types
import type { ReactElement } from "react";

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
      {!session ? (
        // If unauthenticated, display unauthenticated
        <Unauthenticated />
      ) : (
        // If authentiated:
        <div className={styles.layout__main}>
          {/* Render children */}
          <div>{children}</div>

          {/* Render auth status */}
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
            </div>

            {/* Name + Sign out */}
            <div>
              <h3>{session.user.name}</h3>
              <button onClick={() => signOut()}>Sign out</button>
            </div>
          </div>
        </div>
      )}
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
