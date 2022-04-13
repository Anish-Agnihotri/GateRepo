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
        <p>Private repos you have admin access to:</p>
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
        <p>Active gates with unused invites:</p>
        <div className={styles.home__gates}>
          {gateLoading ? (
            // Loading state
            <Loading />
          ) : gates.length > 0 ? (
            gates.map((gate: Gate, i: number) => {
              return <IndividualGate gate={gate} getGates={getGates} key={i} />;
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

// Individual gate
function IndividualGate({
  gate,
  getGates,
}: {
  gate: Gate;
  getGates: () => void;
}) {
  const [copyText, setCopyText] = useState<string>("Copy Invite"); // Copy button
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false); // Delete button loading

  const numUnusedInvites: number = gate.numInvites - gate.usedInvites; // Unused invites

  /**
   * Deletes gate
   * @param {string} gateId to delete
   */
  const deleteGate = async (gateId: string) => {
    setDeleteLoading(true); // Toggle loading

    try {
      // Push delete
      await axios.post("/api/gates/delete", { id: gateId });
      // Reload all gates
      await getGates();
      // Toast success
      toast.success("Successfully deleted gate.");
    } catch (e) {
      // Else, log error
      console.error(e);
      toast.error("Error deleting gate.");
    }

    setDeleteLoading(false); // Toggle loading
  };

  /**
   * Copy gateId to clipboard
   * @param {string} gateId to copy
   */
  const copyInvite = (gateId: string) => {
    const domain = process.env.NEXT_PUBLIC_URL;
    // Copy to clipboard
    navigator.clipboard.writeText(`${domain}/repo/join/${gateId}`);

    // Update button
    setCopyText("Copied!");
    setTimeout(() => setCopyText("Copy Invite"), 2000);
  };

  /**
   * Formats number to us-en format (commas)
   * @param {number} num to format
   * @returns {string} formatted number
   */
  const formatNumber = (num: number): string => {
    return num.toLocaleString("us-en");
  };

  return (
    <div className={styles.home__gates_item}>
      {/* Repository */}
      <div>
        <a
          href={`https://github.com/${gate.repoOwner}/${gate.repoName}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          @{gate.repoOwner}/{gate.repoName}
        </a>
      </div>

      {/* Invite status */}
      <div>
        <p>
          <strong>Unused Invites: </strong>
          {formatNumber(numUnusedInvites)}
        </p>
        <p>
          <strong>Tokens Required:</strong> {formatNumber(gate.numTokens)}{" "}
          <a
            href={`https://etherscan.io/token/${gate.contract}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {gate.contractName}
          </a>{" "}
          token{gate.numTokens == 1 ? "" : "s"}
        </p>
        <p>
          <strong>Token Check Block Number:</strong>{" "}
          <a
            href={`https://etherscan.io/block/${gate.blockNumber}`}
            target="_blank;"
            rel="noopener noreferrer"
          >
            #{formatNumber(gate.blockNumber)}
          </a>
        </p>
        {gate.readOnly ? (
          <p>
            <strong>Permission:</strong> Read-only
          </p>
        ) : null}
      </div>

      {/* Actions */}
      <div>
        <button onClick={() => copyInvite(gate.id)}>{copyText}</button>
        <button onClick={() => deleteGate(gate.id)} disabled={deleteLoading}>
          {deleteLoading ? "Deleting..." : "Delete Gate"}
        </button>
      </div>
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
