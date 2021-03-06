import axios from "axios"; // Requests
import { ethers } from "ethers"; // Ethers
import { useState } from "react"; // State management
import { toast } from "react-toastify"; // Toast notifications
import Layout from "components/Layout"; // Layout wrapper
import { useRouter } from "next/router"; // Navigation
import { getSession } from "next-auth/react"; // Auth
import { getRepo } from "pages/api/github/repo"; // Repo details
import styles from "styles/pages/Create.module.scss"; // Page styles

// Types
import type { Repo } from "pages/api/github/repos";

/**
 * Check if a provided address is valid
 * @param {string} address to check
 * @returns {boolean} validity
 */
export function isValidAddress(address: string): boolean {
  try {
    // Check if address is valid + checksum match
    ethers.utils.getAddress(address);
  } catch {
    // If not, return false
    return false;
  }

  // Else, return true
  return true;
}

export default function Create({
  owner,
  repository,
  repo,
}: {
  owner: string;
  repository: string;
  repo: Repo;
}) {
  // Routing
  const { push } = useRouter();

  const [address, setAddress] = useState<string>(""); // Contract address
  const [numTokens, setNumTokens] = useState<number>(1); // Number of required tokens
  const [loading, setLoading] = useState<boolean>(false); // Loading
  const [numParticipants, setNumParticipants] = useState<number>(10); // Maximum invite count

  // Input validation
  const invalidAddress: boolean = !isValidAddress(address);
  const invalidNum: boolean = numTokens == 0 || numParticipants == 0;
  const invalidInput: boolean = invalidAddress || invalidNum;

  /**
   * Creates new gated repository
   */
  const createGate = async () => {
    setLoading(true); // Toggle loading

    try {
      const {
        data: { id },
      }: { data: { id: string } } = await axios.post(`/api/gates/create`, {
        owner,
        repo: repository,
        contract: address,
        tokens: numTokens,
        invites: numParticipants,
      });
      // Copy invite to clipboard
      navigator.clipboard.writeText(`https://gaterepo.com/repo/join/${id}`);

      // Toast and return to home
      toast.success("Successfully created gated repository. Invite copied.");
      push("/");
    } catch (e) {
      console.error(e);
      toast.error("Error when creating gated repository.");
    }

    setLoading(false); // Toggle loading
  };

  return (
    <Layout>
      <div className={styles.create}>
        {/* Description */}
        <h2>Token Gate</h2>
        <p>
          Restricting access to{" "}
          <a href={repo.htmlURL} target="_blank" rel="noopener noreferrer">
            @{repo.fullName}
          </a>
          .
        </p>

        {/* Input menu */}
        <div className={styles.create__menu}>
          {/* Contract */}
          <label htmlFor="contract">ERC20 Token Address</label>
          <input
            id="contract"
            type="text"
            placeholder="0x1f9840a85d5af5bf1d1762f925bdaddc4201f984"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          {/* Number of required tokens */}
          <label htmlFor="numTokens">Number of required tokens</label>
          <input
            id="numTokens"
            type="number"
            step="1"
            min="1"
            value={numTokens}
            onChange={(e) => setNumTokens(Number(e.target.value))}
          />

          {/* Max invite count */}
          <label htmlFor="numParticipants">Maximum invites</label>
          <input
            id="numParticipants"
            type="number"
            step="1"
            min="1"
            value={numParticipants}
            onChange={(e) => setNumParticipants(Number(e.target.value))}
          />

          {/* Create gated repository */}
          <button
            onClick={() => createGate()}
            disabled={invalidInput || loading}
          >
            {invalidAddress
              ? "Invalid contract address"
              : invalidInput
              ? "Invalid number of tokens or participants"
              : loading
              ? "Creating gated repository..."
              : `Gate @${repo.fullName}`}
          </button>
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: any) {
  // Collect session
  const session = await getSession(context);
  // Collect repo from URL
  const { owner, repo: repository }: { owner: string; repo: string } =
    context.query;

  try {
    // Throw if params not present
    if (!owner || !repository || !session || !session.user.id)
      throw new Error();

    // Collect repo (check admin access) or throw
    const repo: Repo = await getRepo(session.user.id, owner, repository);
    if (!repo) throw new Error();

    return {
      props: {
        owner,
        repository,
        repo,
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
