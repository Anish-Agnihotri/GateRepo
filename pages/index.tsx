import axios from "axios"; // Requests
import { toast } from "react-toastify"; // Notifications
import Layout from "components/Layout"; // Layout wrapper
import { useRouter } from "next/router"; // Navigation
import { useEffect, useState } from "react"; // State management
import { getSession } from "next-auth/react"; // Auth
import styles from "styles/pages/Home.module.scss"; // Page styles
import { InfinitySpin } from "react-loader-spinner"; // Loader

// Types
import type { Gate } from "@prisma/client";
import type { Repo } from "pages/api/github/repos";

export default function Home({ userId }: { userId: string | null }) {
  // Routing
  const { push } = useRouter();

  // Repos + Loading
  const [repos, setRepos] = useState<Repo[]>([]);
  const [repoLoading, setRepoLoading] = useState<boolean>(true);

  // Gates + loading
  const [gates, setGates] = useState<Gate[]>([]);
  const [gateLoading, setGateLoading] = useState<boolean>(true);

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

  /**
   * Collects all gates
   */
  const getGates = async () => {
    setGateLoading(true); // Toggle loading

    try {
      // Collect and store
      const { data } = await axios.get("/api/gates/all");
      console.log(data);
      setGates(data);
    } catch (e) {
      console.error(e);
    }

    setGateLoading(false); // Toggle loading
  };

  /**
   * Deletes gate
   * @param {string} gateId to delete
   */
  const deleteGate = async (gateId: string) => {
    try {
      await axios.post("/api/gates/delete", { id: gateId });
      await getGates();
      toast.success("Successfully deleted gate.");
    } catch (e) {
      console.error(e);
      toast.error("Error deleting gate.");
    }
  };

  // On mount -> Collect repos if authenticated
  useEffect(() => {
    if (userId && repos.length == 0) {
      getAllRepos();
    }
  }, [userId]);

  // On mount -> Collect gates if authenticated
  useEffect(() => {
    if (userId && gates.length == 0) {
      getGates();
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
        <p>Active gates (remaining unused invites)</p>
        <div className={styles.home__gates}>
          {gateLoading ? (
            // Loading state
            <Loading />
          ) : gates.length > 0 ? (
            gates.map((gate: Gate, i: number) => {
              return (
                <div className={styles.home__gates_item} key={i}>
                  <div>
                    <a
                      href={`https://github.com/${gate.repoOwner}/${gate.repoName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @{gate.repoOwner}/{gate.repoName}
                    </a>
                    <p>
                      Invites used: {gate.usedInvites}/{gate.numInvites}
                    </p>
                    <p>
                      {gate.numTokens} token(s) required (contract:{" "}
                      <a
                        href={`https://etherscan.io/token/${gate.contract}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {gate.contract.substr(0, 6) +
                          "..." +
                          gate.contract.slice(gate.contract.length - 4)}
                      </a>
                      )
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://gaterepo.com/join/${gate.id}`
                        );
                      }}
                    >
                      Copy Invite
                    </button>
                    <button onClick={() => deleteGate(gate.id)}>
                      Delete Gate
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            // Else, display empty
            <Empty />
          )}
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
