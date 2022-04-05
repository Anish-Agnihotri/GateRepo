import styles from "styles/components/Layout.module.scss";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Layout({ children }) {
  const { data: session } = useSession();

  return (
    <div>
      <div className={styles.layout}>
        {!session ? (
          <Unauthenticated />
        ) : (
          <div className={styles.layout__main}>
            <div>{children}</div>

            <h2>User</h2>
            <div className={styles.layout__main_auth}>
              <div>
                <img
                  src={
                    session.user.image ??
                    `https://github.com/identicons/${session.user.id}.png`
                  }
                  alt="Avatar"
                />
              </div>
              <div>
                <h3>{session.user.name}</h3>
                <button onClick={() => signOut()}>Sign out</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

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
