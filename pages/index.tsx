import axios from "axios"; // Requests
import { toast } from "react-toastify"; // Notifications
import Layout from "components/Layout"; // Layout wrapper
import { useRouter } from "next/router"; // Navigation
import { useEffect, useState } from "react"; // State management
import { getSession } from "next-auth/react"; // Auth
import styles from "styles/pages/Home.module.scss"; // Page styles
import { InfinitySpin } from "react-loader-spinner"; // Loader

// Types
import type { Repo } from "pages/api/github/repos";

export default function Home({ userId }: { userId: string | null }) {
  // Routing
  const { push } = useRouter();

  // Repos + Loading
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoLoading, setRepoLoading] = useState<boolean>(true);

  /**
   * Collects all private repos where user has admin access
   */
  const getAllRepos = async () => {
    setRepoLoading(true); // Toggle loading

    try {
      // Collect and store
      const { data } = await axios.get("/api/github/repos");
      setRepos(data);
    } catch (e) {
      console.error(e);
    }

    setRepoLoading(false); // Toggle loading
  };

  // On mount -> Collect repos if authenticated
  useEffect(() => {
    if (userId && repos.length == 0) {
      getAllRepos();
    }
  }, [userId]);

  return (
    <Layout>
      <div className={styles.home}>
        {/* All private repos */}
        <h2>All Repos</h2>
        <p>Private repos you have admin access to</p>
        <div className={styles.home__repo}>
          {repoLoading ? (
            // Loading state
            <Loading />
          ) : // All repos
          repos.length > 0 ? (
            repos.map((repo: Repo, i: number) => {
              return (
                <div className={styles.home__repo_item} key={i}>
                  {/* Repo name + link */}
                  <a
                    href={repo.htmlURL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {repo.fullName}
                  </a>

                  {/* Create gated repo */}
                  <button onClick={() => push(`/repo/create/${repo.fullName}`)}>
                    Gate
                  </button>
                </div>
              );
            })
          ) : (
            <Empty />
          )}
        </div>

        {/* Existing gated repos */}
        <h2>Gated Repos</h2>
        <p>Repos currently gated by GateRepo</p>
        <div>
          <Empty />
        </div>
      </div>
    </Layout>
  );
}

// Loading spinner
function Loading() {
  return (
    <div className={styles.home__loading}>
      <InfinitySpin color="grey" width="200" />
    </div>
  );
}

// Empty placeholder
function Empty() {
  return (
    <div className={styles.home__empty}>
      <h3>No repos found</h3>
    </div>
  );
}

export async function getServerSideProps(context: any) {
  // Collect session, check auth
  const session = await getSession(context);

  return {
    props: {
      session,
      userId: session?.user.id ?? null,
    },
  };
}
